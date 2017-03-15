"""Script to calculate signal and FFT related data
outputs JSON string

Author: Zander Blasingame
"""

import argparse
import sys
import json
import numpy as np

parser = argparse.ArgumentParser()

parser.add_argument('signal',
                    type=str,
                    help='JSON formatted string that is the signal data')
parser.add_argument('sampling_rate',
                    type=int,
                    help='Sampling rate in Hz')

args = parser.parse_args()

signal = np.array(json.loads(args.signal))
t = np.linspace(0, signal.size/args.sampling_rate, signal.size)
fft = np.fft.fft(signal)
freqs = np.fft.fftfreq(signal.size)
freqs = np.fft.fftshift(freqs)
freqs = freqs * args.sampling_rate
mag = np.absolute(fft)
phase = np.angle(fft)

data = {
    'signal': {
        'y': signal.tolist(),
        'x': t.tolist(),
        'min': float(np.min(signal)),
        'max': float(np.max(signal)),
        'avg': float(np.sum(signal)/signal.size)
    },
    'fft_mag': {
        'y': mag.tolist(),
        'x': freqs.tolist(),
        'min': float(np.min(mag)),
        'max': float(np.max(mag)),
        'avg': float(np.sum(mag)/mag.size),
    },
    'fft_phase': {
        'y': phase.tolist(),
        'x': freqs.tolist(),
        'min': float(np.min(phase)),
        'max': float(np.max(phase)),
        'avg': float(np.sum(phase)/phase.size),
    }
}

print(json.dumps(data))

sys.stdout.flush()
