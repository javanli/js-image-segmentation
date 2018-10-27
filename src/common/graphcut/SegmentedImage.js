import Utils from './Utils';
import sigma from 'sigma';
import MaxFlow from './MaxFlow';

const nj = require('./numjs');

function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function yToHex(y) {
	return "#" + componentToHex(y) + componentToHex(y) + componentToHex(y);
}

class SegmentedImage {
	constructor(image, indexMap, segmentSize, foregroundSeedPixels, backgroundSeedPixels) {
		this.img = image;
		this.indexMap = indexMap;
		[this.w,this.h] = [this.img.width, this.img.height];
		this.maxSP = segmentSize - 1;
		this.pixel_values = image.data;

		this.obj_seeds = foregroundSeedPixels;
		this.bkp_seeds = backgroundSeedPixels;

		this.lambda_factor = 1;
		this.sigma_factor = 40;
		this.segments = [];
		for(let i=0;i<indexMap.length;i++){
			let segIdx = indexMap[i];
			if(!this.segments[segIdx]){
				this.segments[segIdx] = {
					cnt : 1,
					colorAll : this.getAvgColor(i),
					idxAll : i
				}
			}
			else{
				let seg = this.segments[segIdx];
				seg.cnt ++;
				seg.colorAll += this.getAvgColor(i);
				seg.idxAll += i;
			}
		}
		for(let i=0;i<segmentSize;i++){
			let seg = this.segments[i];
			seg.pixelIdx = Math.round(seg.idxAll / seg.cnt);
			seg.color = Math.round(seg.colorAll / seg.cnt);
		}
		console.log(this.segments)
		sigma.classes.graph.addMethod( 'maxFlow', function(source,target) {
			return new MaxFlow(this, source, target).DinicMaxFlow();
		});
		sigma.classes.graph.addMethod( 'hasEdge', function(id) {
			return id in this.edgesIndex;
		});

		this.calculateBoundaryCosts();
	}
	getAvgColor(idx) {
		let p = idx * 4;
		return (this.pixel_values[p] + this.pixel_values[p+1] + this.pixel_values[p+2])/3;
	}
	specialNeighbours(x,y) {
		return [{ x : x-1 , y: y }, { x: x+1, y: y }, { x: x, y: y-1}, {x: x, y: y+1} ].filter( (coord) => {
			return 0 <= coord.x && coord.x < this.w && 0 <= coord.y && coord.y < this.h && (coord.x !== x || coord.y !== y);
		});
	}

	boundaryPenalty(p_a,p_b) {
		const i_delta = this.getSegmentValue(p_a) - this.getSegmentValue(p_b);
		const pCoord_a = Utils.getPixelCoord(this.segments[p_a].pixelIdx, this.w);
		const pCoord_b = Utils.getPixelCoord(this.segments[p_b].pixelIdx, this.w);

		const distance = Math.sqrt( Math.pow(pCoord_b.y - pCoord_a.y,2) + Math.pow(pCoord_b.x - pCoord_a.x,2) );

		return Math.exp( - (i_delta*i_delta) / (2.0 * Math.pow(this.sigma_factor,2) ) ) / distance;
	}

	calculateBoundaryCosts() {
		this.boundary_costs = {};
		this.boundary_sum = {};
		let max = 0;
		for(let p = 0; p < this.pixel_values.length; p+=4){
			const pCoord = Utils.getPixelCoord(p, this.w);
			let pSP = this.indexMap[p/4];
			this.boundary_costs[pSP] = {};
			this.boundary_sum[pSP] = 0;
			this.specialNeighbours(pCoord.x, pCoord.y).forEach( (coord) => {
				const n_p = Utils.getPixelOffset(coord.x, coord.y, this.w);
				let npSP = this.indexMap[n_p/4];
				if (pSP == npSP){
					return;
				}
				this.boundary_costs[pSP][npSP] = this.boundaryPenalty(pSP,npSP);
				this.boundary_sum[pSP] += this.boundary_costs[pSP][npSP];
			});

			if ( max < this.boundary_sum[pSP] ) {
				max = this.boundary_sum[pSP];
			}
		}

		//calculating K
		this.k_factor = 1.0 + max ;
	}
	getSegmentValue(seg){
		return this.segments[seg].color;
	}

	calculate_normal(points) {
		const values = Object.keys(points).map( seg => this.getSegmentValue(seg) );
		return [ nj.mean(values), Math.max( nj.std(values), 0.00001 )];
	}

	norm_pdf(x,mu,sigma) {
		const factor = (1.0 / (Math.abs(sigma) * Math.sqrt(2 * Math.PI)));
		return factor * Math.exp( -Math.pow((x-mu),2) / (2.0 * Math.pow(sigma,2)) )
	}

	regional_cost(seg,mean,std) {
		const prob = Math.max(this.norm_pdf(this.getSegmentValue(seg),mean,std), 0.000000000001);
		return - this.lambda_factor * Math.log(prob);
	}

	make_id(x,y) {
	return `${x},${y}`;
}

	createGraph() {
		this.graph = new sigma.classes.graph();
		this.obj_node = {
			id : 'obj',
			x : -2,
			y : -2,
			label : 'obj',
			size : 1
		};
		this.graph.addNode(this.obj_node);
		this.bkp_node = {
			id : 'bkp',
			x : this.w + 1,
			y : this.h + 1,
			label : 'bkp',
			size: 1
		};
		this.graph.addNode(this.bkp_node);
		
		for(let p = 0; p < this.maxSP + 1; p+=1){
			let segment = this.segments[p];
			let point = Utils.getPixelCoord(segment.pixelIdx, this.w);
			this.graph.addNode({
				id : p,
				x : point.x,
				y : point.y,
				size : 0.3,
				label: `Ip = ${p}; x: ${p}, y: ${p}`,
				color: yToHex(p)
			});
		}
		//inter pixel edges
		for( let x = 0; x < this.w; x++ ) {
			for( let y = 0; y < this.h; y++ ) {
				const p = Utils.getPixelOffset(x,y,this.w);
				let pSP = this.indexMap[p/4];
				this.specialNeighbours(x, y).forEach( (coord) => {
					const n_p = Utils.getPixelOffset(coord.x, coord.y, this.w);
					let npSP = this.indexMap[n_p/4];
					if (pSP == npSP){
						return;
					}
					if ( ! this.graph.hasEdge( this.make_id(pSP,npSP) ) ) {
						this.graph.addEdge({
							id : this.make_id(pSP,npSP),
							source : pSP,
							target : npSP,
							capacity : this.boundary_costs[pSP][npSP],
							color: '#ccc',
						});
					}
					if ( ! this.graph.hasEdge( this.make_id(npSP, pSP) ) ) {
						this.graph.addEdge({
							id : this.make_id(npSP,pSP),
							source : npSP,
							target : pSP,
							capacity : this.boundary_costs[pSP][npSP],
							color: '#ccc',
						});
					}
				});
			}
		}

		
		
		//obj/bkp edges
		for(let p = 0; p < this.maxSP + 1; p+=1){
			this.graph.addEdge({
				id : this.make_id('obj',p),
				source : 'obj',
				target : p,
				capacity : this.regional_penalty_obj[p]
			});
			this.graph.addEdge({
				id : this.make_id(p, 'obj'),
				source : p,
				target : 'obj',
				capacity : this.regional_penalty_obj[p]
			});

			this.graph.addEdge({
				id : this.make_id('bkp',p),
				source : p,
				target : 'bkp',
				capacity :this.regional_penalty_bkp[p]
			});
			this.graph.addEdge({
				id : this.make_id(p,'bkp'),
				source : 'bkp',
				target : p,
				capacity :this.regional_penalty_bkp[p]
			});
		}
	}

	segment() {
		//Updating regional penalties
		let obj_mean, obj_std, bkp_mean, bkg_std;
		[obj_mean,obj_std] = this.calculate_normal(this.obj_seeds);
		[bkp_mean,bkg_std] = this.calculate_normal(this.bkp_seeds);
		this.regional_penalty_obj = {};
		this.regional_penalty_bkp = {};

		for(let p = 0; p < this.maxSP + 1; p+=1){
			if (  p in this.obj_seeds ) {
				this.regional_penalty_obj[p] =  this.k_factor;
				this.regional_penalty_bkp[p] = 0;
			} else {
				if ( p in this.bkp_seeds ) {
					this.regional_penalty_obj[p] = 0;
					this.regional_penalty_bkp[p] = this.k_factor;
				} else {
					this.regional_penalty_obj[p] = this.regional_cost(p, bkp_mean, bkg_std);
					this.regional_penalty_bkp[p] = this.regional_cost(p, obj_mean, obj_std);
				}
			}
		}

		//create the graph
		console.log('start create graph',new Date().toDateString());
		this.createGraph();
		console.log('start maxflow',new Date().toDateString());
		const mf = this.graph.maxFlow(this.obj_node, this.bkp_node);
		console.log('start mincut',new Date().toDateString());
		const cut = mf.minCut();
		this.segmentation = [];

		for(let p = 0; p < this.maxSP+1; p+=1){
			if ( this.make_id('bkp',p) in cut ) {
				this.segmentation[p] = 'obj';
			} else {
				this.segmentation[p] = 'bkp';
			}
		}
		this.graph = { nodes: this.graph.nodes(), edges: this.graph.edges() };
	}
}

export default SegmentedImage;