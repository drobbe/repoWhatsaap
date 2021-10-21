
const startTime = new Date()


setTimeout(() => {
	var endTime = new Date();
	var timeDiff = endTime - startTime;

	var hours = Math.round(timeDiff % 24);

	console.log(hours)
}, 10000);

