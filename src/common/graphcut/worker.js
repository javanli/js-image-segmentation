import SegmentedImage from './SegmentedImage';
import SLICSegmentation from '../slic-segmentation'
self.addEventListener('message', (e) => {
	let { imgData, triData } = e.data;
	let result = SLICSegmentation(imgData,{})
	console.log(result)
	let {indexMap,size} = result;

	let obj_seeds = {};
	let bkp_seeds = {};
	for (let i = 0; i < triData.data.length; i += 4) {
		if (triData.data[i] != 0) {
			let sp = indexMap[i/4];
			bkp_seeds[sp] = true;
		}
		else if (triData.data[i + 1] != 0) {
			let sp = indexMap[i/4];
			obj_seeds[sp] = true;
		}
	}
	console.log(obj_seeds,bkp_seeds)
	const segmentedImage = new SegmentedImage(imgData, indexMap,size, obj_seeds, bkp_seeds);
	console.log('start segment',new Date().toDateString());
	segmentedImage.segment();
	console.log('end segment',new Date().toDateString());
	let segmentation = segmentedImage.segmentation;
	for (let i = 0; i < imgData.height; i++) {
		for (let j = 0; j < imgData.width; j++) {
			let segID = indexMap[i * imgData.width + j]
			if (segmentation[segID] == 'bkp') {
				imgData.data[(i * imgData.width + j) * 4 + 3] = 0;
			}
		}
	}
	self.postMessage({ imgData });
});