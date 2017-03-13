'use-strict';

var express = require('express');
var app = express();
var port = 8000;

// for serial port handling
var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
var serialPort = new SerialPort('/dev/ttyS0', {
	baudrate: 9600,
	parser: serialport.parsers.readline('\n')
});

// for data collection
var sample_size = 256;
var serial_data = [new Array(sample_size), new Array(sample_size)];
var out_data = [create_signal(), create_signal()];
out_data[0].signal = new Array(sample_size).fill(0);
out_data[1].signal = new Array(sample_size).fill(0);
var channel = 0;
var serial_index = 0;

// for fft
var FFT = require('fft.js')
var fft = new FFT(sample_size);
var fft_out = [create_signal(), create_signal()]
fft_out[0].signal = fft.createComplexArray();
fft_out[1].signal = fft.createComplexArray();

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
		update_signal(out_data[0], gen_random_sine(sample_size, 10));
		update_signal(out_data[1], gen_random_sine(sample_size, 10));

		fft.realTransform(fft_out[0].signal, out_data[0].signal);
		fft.realTransform(fft_out[1].signal, out_data[1].signal);

		update_signal(fft_out[0], fft_out[0].signal);
		update_signal(fft_out[1], fft_out[1].signal);

		console.log('Data sent');

		io.sockets.emit('signal', {
			signal: out_data,
			fft: fft_out
		});
	});
});

var gen_random_sine = function(size, timescale) {
	arr = new Array(size);

	var phi = Math.random();
	var a = 2 * Math.random() + 1;
	var num_add = Math.floor(4 * Math.random()) + 1;

	for (var i=0; i<size; i++) {
		var t = (i/size) * timescale;

		var val = 0;
		for (var j=1; j<=num_add; j++) {
			val += a * Math.sin(j*t + phi) * Math.max(Math.random(), 0.2);
		}
		arr[i] = val;
	}

	return arr;
};

// function to generate signal object
function create_signal() {
	return {
		signal: [],
		min: 0,
		max: 0,
		avg: 0,
		p_min: 0,
		p_max: 0,
		p_avg: 0,
		d_min: 0,
		d_max: 0,
		d_avg: 0
	}
}

function update_signal(signal, data) {
	signal.signal = data;
	signal.p_min = signal.min;
	signal.p_max = signal.max;
	signal.p_avg = signal.avg;
	signal.min = arrayMin(data);
	signal.max = arrayMax(data);
	signal.avg = arrayAvg(data);
	signal.d_min = (signal.min - signal.p_min) / signal.p_min * 100;
	signal.d_max = (signal.max - signal.p_max) / signal.p_max * 100;
	signal.d_avg = (signal.avg - signal.p_avg) / signal.p_avg * 100;
}


// read serial port data
serialPort.on('open', function() {
	serialPort.on('data', function(data) {
		console.log(data);

		serial_data[channel][serial_index] = data;

		channel = channel == 0 ? 1 : 0;

		if (serial_index <= sample_size) {
			serial_index++;
		} else {
			out_data = serial_data;
			serial_index = 0;
		}

	});
});


// Min and max calculations
function arrayMin(arr) {
  return arr.reduce(function (p, v) {
    return ( p < v ? p : v );
  });
}

function arrayMax(arr) {
  return arr.reduce(function (p, v) {
    return ( p > v ? p : v );
  });
}

function arrayAvg(arr) {
	return arr.reduce(function (p, v) {
		return p + v;
	})/arr.length;
}
