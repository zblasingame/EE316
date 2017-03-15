'use-strict';

var express = require('express');
var app = express();
var port = 8000;

// for serial port handling
var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
var serialPort = new SerialPort('/dev/ttyS1', {
	baudrate: 115200,
	parser: serialport.parsers.readline('\n')
});

// for data collection
var sampling_rate = 4500 // in Hz
var sample_size = 256;//256;
var serial_data = [new Array(sample_size), new Array(sample_size)];
var out_data = [new Array(sample_size), new Array(sample_size)];
var fft_data = [new Array(sample_size), new Array(sample_size)];
var channel = 0;
var serial_index = 0;

//routing
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/public/views/index.html')
});

app.use(express.static('public'));

var io = require('socket.io').listen(app.listen(port, function() {
	console.log('Server is listening on port: ' + port);
}));

// communicate with client
io.on('connection', function(socket) {
	console.log('New client connection');

	// socket.on('sample_size', function() {
	io.sockets.emit('sample_size', sample_size);
	// });

	socket.on('update_data', function() {
		out_data[0] = gen_random_sine(sample_size, 10);
		out_data[1] = gen_random_sine(sample_size, 10);

		get_signal_info(out_data[0], function(ch1_data) {
			get_signal_info(out_data[1], function(ch2_data) {
				io.sockets.emit('signal', [JSON.parse(ch1_data), JSON.parse(ch2_data)]);

				console.log('Data sent');
			});
		});
	});
});

// generate test data
var gen_random_sine = function(size) {
	arr = new Array(size);

	var phi = Math.random();
	var a = 2 * Math.random() + 1;
	var num_add = Math.floor(4 * Math.random()) + 1;

	for (var i=0; i<size; i++) {
		var t = (i/sampling_rate);

		var val = 0;
		for (var j=1; j<=num_add; j++) {
			val += a * Math.sin(j*t + phi) * Math.max(Math.random(), 0.2);
		}
		// arr[i] = val;
		arr[i] = Math.sin(400 * Math.PI * i/sampling_rate);
		// arr[i] = Math.sign(arr[i]);
	}

	return arr;
};


// read serial port data
serialPort.on('open', function() {
	console.log('Open connection');
	serialPort.on('data', function(data) {
		console.log(data);

		// serial_data[channel][serial_index] = data;
		//
		// channel = channel == 0 ? 1 : 0;
		//
		// if (serial_index <= sample_size) {
		// 	serial_index++;
		// } else {
		// 	out_data = serial_data;
		// 	serial_index = 0;
		// }

	});
});

// calculate signal and fft stats
function get_signal_info(data, callback) {
	var spawn = require('child_process').spawn;
	var py = spawn('python', ['signal_stat.py',
		'[' + data.toString() + ']',
		sampling_rate.toString()]);
	var py_data = '';

	py.stdout.on('data', function(chunk) {
		py_data += chunk.toString('utf8');
	});

	py.stdout.on('end', function() {
		callback(py_data);
	});
}
