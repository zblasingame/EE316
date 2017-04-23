(function($) {
	'use-strict';
	$(document).ready(function() {
		var socket = io.connect();

		// function to initialize chart
		var init_chart = function(ctx, options) {
			var datasets = [];
			var coords = [];

			for (var j=0; j<options.sample_size; j++) {
				coords.push({x: 0, y: 0});
			}

			pointRadius = options.pointRadius === undefined ? 1 : pointRadius;
			// pointRadius = 1;

			for (var i=0; i<options.labels.length; i++) {
				datasets.push({
					label: options.labels[i],
					backgroundColor: options.backgroundColors[i],
					borderColor: options.colors[i],
					borderCapStyle: 'butt',
					pointBorderColor: options.colors[i],
					pointBackgroundColor: '#fff',
					pointBorderWidth: 1,
					pointHoverRadius: 5,
					pointHoverBackgroundColor: options.colors[i],
					pointHoverBorderColor: 'rbga(220,220,220,1)',
					pointHoverBorderWidth: 2,
					pointRadius: 1,
					pointHitRadius: 10,
					fill: false,
					data: coords
				});
			}

			return new Chart(ctx, {
				type: 'line',
				data: {
					labels: new Array(options.sample_size),
					datasets: datasets
				},
				options: {
					// pan: {
					// 	enabled: true,
					// 	mode: 'xy'
					// },
					// zoom: {
					// 	enabled: true,
					// 	mode: 'xy'
					// },
					legend: {
						display: false
					},
					scales: {
						xAxes: [{
							type: options.scale_type,
							position: 'bottom',
							scaleLabel: {
								display: true,
								labelString: options.xlabel
							}
						}],
						yAxes: [{
							scaleLabel: {
								display: true,
								labelString: options.ylabel
							}
						}]
					}
				}
			});
		};

		// create charts
		var sample_size = 0;
		var signal_charts = [];
		var mag_charts = [];
		var phase_charts = [];
		var log_charts = [];

		socket.on('sample_size', function(size) {
			signal_charts.push(init_chart($('#signal1'), {
				labels: ['Signal 1'],
				colors: ['#16a085'],
				backgroundColors: ['#16a085'],
				sample_size: size,
				scale_type: 'linear',
				xlabel: 'Time (s)',
				ylabel: 'Voltage (V)'
			}));

			signal_charts.push(init_chart($('#signal2'), {
				labels: ['Signal 2'],
				colors: ['#2980b9'],
				backgroundColors: ['#2980b9'],
				sample_size: size,
				scale_type: 'linear',
				xlabel: 'Time (s)',
				ylabel: 'Voltage (V)'
			}));

			mag_charts.push(init_chart($('#fft-mag1'), {
				labels: ['Signal 1'],
				colors: ['#16a085'],
				backgroundColors: ['#16a085'],
				sample_size: size,
				scale_type: 'linear',
				xlabel: 'Frequency (Hz)',
				ylabel: 'Magnitude (dB)',
				pointRadius: 5
			}));

			mag_charts.push(init_chart($('#fft-mag2'), {
				labels: ['Signal 2'],
				colors: ['#2980b9'],
				backgroundColors: ['#2980b9'],
				sample_size: size,
				scale_type: 'linear',
				xlabel: 'Frequency (Hz)',
				ylabel: 'Magnitude (dB)'
			}));

			log_charts.push(init_chart($('#fft-log1'), {
				labels: ['Signal 1'],
				colors: ['#16a085'],
				backgroundColors: ['#16a085'],
				sample_size: size/2-1,
				scale_type: 'logarithmic',
				xlabel: 'Frequency (Hz)',
				ylabel: 'Magnitude (dB)'
			}));

			log_charts.push(init_chart($('#fft-log2'), {
				labels: ['Signal 2'],
				colors: ['#2980b9'],
				backgroundColors: ['#2980b9'],
				sample_size: size/2-1,
				scale_type: 'logarithmic',
				xlabel: 'Frequency (Hz)',
				ylabel: 'Magnitude (dB)'
			}));

			phase_charts.push(init_chart($('#fft-phase1'), {
				labels: ['Signal 1'],
				colors: ['#16a085'],
				backgroundColors: ['#16a085'],
				sample_size: size,
				scale_type: 'linear',
				xlabel: 'Frequency (Hz)',
				ylabel: 'Angle (rad)'
			}));

			phase_charts.push(init_chart($('#fft-phase2'), {
				labels: ['Signal 2'],
				colors: ['#2980b9'],
				backgroundColors: ['#2980b9'],
				sample_size: size,
				scale_type: 'linear',
				xlabel: 'Frequency (Hz)',
				ylabel: 'Angle (rad)'
			}));

			socket.emit('update_data');

			sample_size = size;
		});

		// function to update chart
		var update_charts = function(charts, x, y) {
			for (var i=0; i<x.length; i++) {
				charts[0].data.datasets[0].data[i].x = x[i];
				charts[1].data.datasets[0].data[i].x = x[i];

				charts[0].data.datasets[0].data[i].y = y[0][i];
				charts[1].data.datasets[0].data[i].y = y[1][i];

				charts[0].update();
				charts[1].update();
			}

		};

		// poll for data update every 1s
		// setInterval(function() {
		// 	socket.emit('update_data');
		// }, 5000);

		// listen for user request to capture
		$('#update').on('click', function() {
			socket.emit('update_data');
		});

		// collect data from server
		socket.on('signal', function(data) {
			update_charts(signal_charts, data[0].signal.x, [data[0].signal.y, data[1].signal.y]);
			update_charts(mag_charts, data[0].fft_mag.x, [data[0].fft_mag.y, data[1].fft_mag.y]);
			update_charts(phase_charts, data[0].fft_phase.x, [data[0].fft_phase.y, data[1].fft_phase.y]);
			update_charts(log_charts, data[0].fft_log.x, [data[0].fft_log.y, data[1].fft_log.y]);

			update_stat('#maxValue', data[0].signal.max, data[0].signal.pmax, 'V');
			update_stat('#minValue', data[0].signal.min, data[0].signal.pmin, 'V');
			update_stat('#avgValue', data[0].signal.avg, data[0].signal.pavg, 'V');

			update_stat('#maxValue2', data[1].signal.max, data[1].signal.pmax, 'V');
			update_stat('#minValue2', data[1].signal.min, data[1].signal.pmin, 'V');
			update_stat('#avgValue2', data[1].signal.avg, data[1].signal.pavg, 'V');


			update_stat('#maxfft1', data[0].fft_mag.max, data[0].fft_mag.pmax, 'dB');
			update_stat('#maxfreq1', data[0].fft_mag.fmax, data[0].fft_mag.pfmax, 'Hz');
			update_stat('#avgfft1', data[0].fft_mag.avg, data[0].fft_mag.pavg, 'dB');

			update_stat('#maxfft2', data[1].fft_mag.max, data[1].fft_mag.pmax, 'dB');
			update_stat('#maxfreq2', data[1].fft_mag.fmax, data[1].fft_mag.pfmax, 'Hz');
			update_stat('#avgfft2', data[1].fft_mag.avg, data[1].fft_mag.pavg, 'dB');

		});

		// function to update statitics
		var update_stat = function(id, data, delta, unit) {
			var stat = id + ' .stat';
			var trend = id + ' .trend .arrow';
			var arrow = id + ' .trend .fa';
			$(stat).text(round(data, 2) + ' ' + unit);
			$(trend).text(Math.abs(round(delta, 2)) + '%');
			// code to change colors for percent sign
			if (delta > 0) {
				$(arrow).addClass('fa-caret-up');
				$(arrow).removeClass('fa-caret-down');
				$(trend).addClass('up');
				$(trend).removeClass('down');
			} else {
				$(arrow).removeClass('fa-caret-up');
				$(arrow).addClass('fa-caret-down');
				$(trend).addClass('down');
				$(trend).removeClass('up');
			}
		}

		// animtate blocks
		var is_in_viewport = function (el) {
			var rect = el.getBoundingClientRect();
			return (
				rect.top >= 0 &&
				rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
			);
		}

		// listener
		$(window).on('load resize scroll', function() {
			$('.view-animate').each(function(index, element) {
				if (is_in_viewport(element)) {
					$(this).addClass('in-view');
				}
			});
		});

		// function to round numbers
		function round(value, decimals) {
			return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
		}

		// smooth scrolling
		smoothScroll.init();

		// navbar
		$('.header').sticky({
			topSpacing: 0
		});

	});
})(jQuery);
