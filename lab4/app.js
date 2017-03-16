'use-strict';

var express = require('express');
var app = express();
var port = 8000;

// for serial port handling
var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
var serialPort = new SerialPort('/dev/ttyUSB0', {
	baudrate: 115200,
});

// for data collection
var sampling_rate = 6500 // in Hz
var sample_size = 256;//256;
var serial_data = [new Array(sample_size), new Array(sample_size)];
var out_data = [new Array(sample_size), new Array(sample_size)];
var fft_data = [new Array(sample_size), new Array(sample_size)];
var channel = 0;
var serial_index = 0;

// for percent change
var old_data = ['', ''];

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

	io.sockets.emit('sample_size', sample_size);

	// socket.on('update_data', function() {
	// 	// if statement fixes -infinity error
	// 	if (has_collected_data) {
	// 		get_signal_info(out_data[0], old_data[0], function(ch1_data) {
	// 			get_signal_info(out_data[1], old_data[1], function(ch2_data) {
	// 				var data = [JSON.parse(ch1_data), JSON.parse(ch2_data)];
	// 				old_data = [data[0].signal.y, data[1].signal.y];
	// 				io.sockets.emit('signal', data);
	// 				console.log('Data sent');
	// 			});
	// 		});
	// 	}
	// });
});

// generate test data
var gen_random_sine = function(size) {
	arr = new Array(size);

	var phi = Math.PI * Math.random();
	var f = (Math.random() + 1) * 5

	for (var i=0; i<size; i++) {
		arr[i] = Math.sin(f * 200 * Math.PI * i/sampling_rate + phi);
	}

	return arr;
};

// read serial port data
serialPort.on('open', function() {
	console.log('open connection');
	serialPort.on('data', function(data) {
		for (var i=0; i<data.length; i++) {
			update_serial(data[i], function() {
				get_signal_info(out_data[0], old_data[0], function(ch1_data) {
					get_signal_info(out_data[1], old_data[1], function(ch2_data) {
						var data = [JSON.parse(ch1_data), JSON.parse(ch2_data)];
						old_data = [data[0].signal.y, data[1].signal.y];
						io.sockets.emit('signal', data);
						console.log('Data sent to client');
					});
				});
			});
		}
	});
});

// function to update serial data
function update_serial(data, callback) {
	serial_data[channel][serial_index] = (5/255) * parseFloat(data);

	if (serial_index === sample_size - 1 && channel === 1) {
		out_data = serial_data;
		serial_index = 0;
		callback(serial_data)
	} else if (serial_index < sample_size - 1 && channel === 1) {
		serial_index++;
	}

	channel = channel == 0 ? 1 : 0;
}

// calculate signal and fft stats
function get_signal_info(data, old, callback) {
	var spawn = require('child_process').spawn;
	var py = spawn('python', ['signal_stat.py',
		'[' + data.toString() + ']',
		sampling_rate.toString(),
		'[' + old.toString() + ']']);
	var py_data = '';

	py.stdout.on('data', function(chunk) {
		py_data += chunk.toString('utf-8');
	});

	py.stdout.on('end', function() {
		console.log(py_data);
		callback(py_data);
	});

}
