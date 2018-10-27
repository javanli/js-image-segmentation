
class Utils {
	static getPixelOffset(x,y, w) {
		return (y * w + x) * 4;
	}
	static getPixelCoord(offset,w,h) {
		const y = Math.floor( offset / (w*4) );
		return { x : ( offset % (w*4) ) / 4, y  };
	}
}

export default Utils;