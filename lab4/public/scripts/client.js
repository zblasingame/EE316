(function($) {
	'use-strict';
	$(document).ready(function() {
		var socket = io.connect();

		// function to initialize chart
		var init_chart = function(ctx, options) {
			var datasets = [];
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
					data: []
				});
			}

			return new Chart(ctx, {
				type: 'line',
				data: {
					labels: new Array(options.sample_size),
					datasets: datasets
				},
				options: {}
			});
		};

		// create charts
		var sample_size = 0;
		var signal_chart = null;
		var fft_chart = null;

		socket.on('sample_size', function(size) {
			signal_chart = init_chart($('#signal'), {
				labels: ['Signal 1', 'Signal 2'],
				colors: ['#16a085', '#2980b9'],
				backgroundColors: ['#16a085', '#2980b9'],
				sample_size: size
			});

			fft_chart = init_chart($('#fft'), {
				labels: ['Signal 1', 'Signal 2'],
				colors: ['#16a085', '#2980b9'],
				backgroundColors: ['#16a085', '#2980b9'],
				sample_size: size
			});

			sample_size = size;
		});

		// function to update chart
		var update_chart = function(chart, data) {
			var time_axis = new Array(sample_size);
			for (var i=0; i<sample_size; i++) {
				time_axis[i] = (i/sample_size) * 10;
			}

			chart.data.datasets[0].data = data[0];
			chart.data.datasets[1].data = data[1];
			chart.data.labels = time_axis;

			chart.update();
		};

		// poll for data update every 1s
		setInterval(function() {
			socket.emit('update_data');
		}, 5000);

		// collect data from server
		socket.on('signal', function(data) {
			update_chart(signal_chart, [data.signal[0].signal, data.signal[1].signal]);
			update_chart(fft_chart, [data.fft[0].signal, data.fft[1].signal]);

			update_stat('#maxValue', data.signal[0].max, data.signal[0].d_max)
			update_stat('#minValue', data.signal[0].min, data.signal[0].d_min)
			update_stat('#avgValue', data.signal[0].avg, data.signal[0].d_avg)

			update_stat('#maxValue2', data.signal[1].max, data.signal[1].d_max)
			update_stat('#minValue2', data.signal[1].min, data.signal[1].d_min)
			update_stat('#avgValue2', data.signal[1].avg, data.signal[1].d_avg)
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

	});
})(jQuery);
