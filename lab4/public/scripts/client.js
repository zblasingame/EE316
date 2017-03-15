(function($) {
	'use-strict';
	$(document).ready(function() {
		var socket = io.connect();

		// function to initialize chart
		var init_chart = function(ctx, options) {
			var datasets = [];
			var coords = [];

			for (var j=0; j<options.sample_size; j++) {
				coords.push({x: j, y: i });
			}

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
					pan: {
						enabled: true,
						mode: 'x'
					},
					zoom: {
						enabled: true,
						mode: 'x'
					},
					title: {
						display: false,
						text: options.title,
						fontFamily: 'Raleway',
						fontSize: 24
					},
					scales: {
						xAxes: [{
							type: options.scale_type,
							position: 'bottom'
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

		socket.on('sample_size', function(size) {
			signal_charts.push(init_chart($('#signal1'), {
				labels: ['Signal 1'],
				colors: ['#16a085'],
				backgroundColors: ['#16a085'],
				sample_size: size,
				title: 'Signal 1 Trace',
				scale_type: 'linear'
			}));

			signal_charts.push(init_chart($('#signal2'), {
				labels: ['Signal 2'],
				colors: ['#2980b9'],
				backgroundColors: ['#2980b9'],
				sample_size: size,
				title: 'Signal 2 Trace',
				scale_type: 'linear'
			}));

			mag_charts.push(init_chart($('#fft-mag1'), {
				labels: ['Signal 1'],
				colors: ['#16a085'],
				backgroundColors: ['#16a085'],
				sample_size: size,
				title: '\(X_1(j\omega)\)',
				scale_type: 'linear'
			}));

			mag_charts.push(init_chart($('#fft-mag2'), {
				labels: ['Signal 2'],
				colors: ['#2980b9'],
				backgroundColors: ['#2980b9'],
				sample_size: size,
				title: 'Magintude Plot',
				scale_type: 'linear'
			}));

			phase_charts.push(init_chart($('#fft-phase1'), {
				labels: ['Signal 1'],
				colors: ['#16a085'],
				backgroundColors: ['#16a085'],
				sample_size: size,
				title: 'Signal 1 Trace',
				scale_type: 'linear'
			}));

			phase_charts.push(init_chart($('#fft-phase2'), {
				labels: ['Signal 2'],
				colors: ['#2980b9'],
				backgroundColors: ['#2980b9'],
				sample_size: size,
				title: 'Magintude Plot',
				scale_type: 'linear'
			}));

			sample_size = size;
		});

		// function to update chart
		var update_charts = function(charts, x, y) {

			for (var i=0; i<sample_size; i++) {
				charts[0].data.datasets[0].data[i].x = x[i];
				charts[1].data.datasets[0].data[i].x = x[i];

				charts[0].data.datasets[0].data[i].y = y[0][i];
				charts[1].data.datasets[0].data[i].y = y[1][i];


				charts[0].update();
				charts[1].update();
			}

		};

		// poll for data update every 1s
		setInterval(function() {
			socket.emit('update_data');
		}, 5000);

		// collect data from server
		socket.on('signal', function(data) {
			update_charts(signal_charts, data[0].signal.x, [data[0].signal.y, data[1].signal.y]);
			update_charts(mag_charts, data[0].fft_mag.x, [data[0].fft_mag.y, data[1].fft_mag.y]);
			update_charts(phase_charts, data[0].fft_phase.x, [data[0].fft_phase.y, data[1].fft_phase.y]);

			update_stat('#maxValue', data[0].signal.max, 0)
			update_stat('#minValue', data[0].signal.min, 0)
			update_stat('#avgValue', data[0].signal.avg, 0)

			update_stat('#maxValue2', data[2].signal.max, 0)
			update_stat('#minValue2', data[2].signal.min, 0)
			update_stat('#avgValue2', data[2].signal.avg, 0)

		});

		// function to update statitics
		var update_stat = function(id, data, delta) {
			var stat = id + ' .stat';
			var trend = id + ' .trend .arrow';
			var arrow = id + ' .trend .fa';
			$(stat).text(round(data, 2) + ' V');
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

	});
})(jQuery);
