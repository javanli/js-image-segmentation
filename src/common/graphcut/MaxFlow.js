class MaxFlow {
	constructor(graph, source, target) {
		this.graph = graph;
		this.source = source;
		this.target = target;
	}

	residualCapacity(e) {
		if ( ! Object.prototype.hasOwnProperty.call(e, 'flow') ) {
			e.flow = 0;
		}
		return e.capacity - e.flow;
	}

	hasAugmentingPath() {
		this.marked = {};
		this.edgeTo = {};
		this.level = {};
		const queue = [];

		for( let v in this.graph.nodesIndex ) {
			this.marked[v] = false;
			this.edgeTo[v] = null;
			this.level[v] = -1;
		}

		this.level[this.source.id ] = 0;

		queue.push( this.source.id );

		this.marked[ this.source.id ] = true;

		while( queue.length > 0 ) {
			const v = queue.shift();
			for (let w in this.graph.outNeighborsIndex[v] ) {
				const e = Object.values(this.graph.outNeighborsIndex[v][w])[0];

				if ( ! this.marked[w] && this.residualCapacity(e) > 0 ) {
					this.edgeTo[w] = e;
					this.marked[w] = true;
					this.level[w] = this.level[w] + 1;
					if ( w == this.target.id ) {
						return true;
					}

					queue.push(w);
				}
			}
		}

		return false;
	}

	BFS() {
		this.level = {};
		const queue = [];

		for( let v in this.graph.nodesIndex ) {
			this.level[v] = -1;
		}

		this.level[this.source.id ] = 0;

		queue.push( this.source.id );

		while( queue.length > 0 ) {
			const v = queue.shift();
			for (let w in this.graph.outNeighborsIndex[v] ) {
				const e = Object.values(this.graph.outNeighborsIndex[v][w])[0];

				if ( this.level[w] < 0 && this.residualCapacity(e) > 0 ) {
					this.level[w] = this.level[v] + 1;
					queue.push(w);
				}
			}
		}

		// IF we can reach to the sink return true
		return this.level[this.target.id] >= 0;
	}
	run() {
		let bottle = Number.MAX_VALUE;
		this.value = 0;
		while( this.hasAugmentingPath() ) {
			for( let x = this.target.id; x != this.source.id; x = this.edgeTo[x].source ) {
				bottle = Math.min(bottle, this.residualCapacity( this.edgeTo[x] ) );
			}

			for( let x = this.target.id; x != this.source.id; x = this.edgeTo[x].source ) {
				this.edgeTo[x].flow += bottle;
			}

			this.value += bottle;
		}

		return this;
	}
	sendFlow(u,flow) {
		if ( u == this.target.id ){
			return flow;
		}

		for( let w in this.graph.outNeighborsIndex[u] ){
			const e = Object.values(this.graph.outNeighborsIndex[u][w])[0];
			if ( this.residualCapacity(e) > 0 && this.level[w] == this.level[u] + 1 ){
				// find minimum flow from u to t
				let curr_flow = Math.min(flow, this.residualCapacity(e));
				let temp_flow = this.sendFlow(w,curr_flow);

				if ( temp_flow > 0 ){
					e.flow += temp_flow;
					const re = Object.values(this.graph.outNeighborsIndex[w][u])[0];
					if ( ! Object.prototype.hasOwnProperty.call(re, 'flow') ) {
						re.flow = 0;
					}
					re.flow -= temp_flow;
					return temp_flow;
				}
			}
		}

		return 0;
	}
	DinicMaxFlow() {
		if ( this.source.id === this.target.id ) {
			return false;
		}

		this.value = 0;

		while( this.BFS() ) {
			let flow = 0;
			while( flow = this.sendFlow(this.source.id,Number.MAX_VALUE) ){
				this.value += flow;
			}
		}

		return this;
	}
	minCut() {
		const cuts = {};
		for( let v in this.graph.nodesIndex ) {
			for (let w in this.graph.outNeighborsIndex[v] ) {
				const e = Object.values(this.graph.outNeighborsIndex[v][w])[0];
				if ( e.source == v && this.residualCapacity(e) == 0 ) {
					cuts[e.id] = e;
				}
			}
		}

		return cuts;
	}
}

export default MaxFlow;