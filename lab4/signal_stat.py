"""Script to calculate signal and FFT related data
outputs JSON string

Author: Zander Blasingame
"""

import argparse
import sys
import json
import numpy as np
import logging

parser = argparse.ArgumentParser()

parser.add_argument('signal',
                    type=str,
                    help='JSON formatted string that is the signal data')
parser.add_argument('sampling_rate',
                    type=int,
                    help='Sampling rate in Hz')
parser.add_argument('old',
                    type=str,
                    help='JSON formatted string that is the old signal data')

args = parser.parse_args()


def p(new, old):
    if old != 0:
        return (new - old)/old * 100
    else:
        return (new - old)/1E-9 * 100


def get_fft(signal):
    t = np.linspace(0, signal.size/args.sampling_rate, signal.size)
    fft = np.fft.fft(signal)
    freqs = np.fft.fftfreq(signal.size)
    # freqs = np.fft.fftshift(freqs)
    freqs = freqs * args.sampling_rate

    # sort fft and freqs
    zipped = list(zip(fft, freqs))
    zipped.sort(key=lambda x: x[1])

    # unzip
    fft, freqs = zip(*zipped)

    # find frequency with largest magnitude ignores dc offset
    zipped = list(zip(fft, np.absolute(freqs)))
    zipped.sort(key=lambda x: -x[0])
    zipped = [entry for entry in zipped if int(entry[1]) != 0]
    _, f_max = zip(*zipped)
    f_max = f_max[0]

    data = {
        'full_mag': 20*np.log10(np.absolute(fft)),
        'angle': np.angle(fft),
        't': t,
        'freqs': np.array(freqs),
        'half_mag': 20*np.log10(np.absolute(fft[int(signal.size/2)+1:])),
        # 'log_freqs': np.log10(np.array(freqs)[int(signal.size/2)+1:])
        'log_freqs': np.array(freqs)[int(signal.size/2)+1:],
        'fmax': f_max
    }

    return data


def _float(f):
    return round(float(f), 2)


signal = np.array(json.loads(args.signal))

_name = args.old if args.old != '[]' else args.signal

_old = np.array(json.loads(_name))

data = get_fft(signal)
old = get_fft(_old)

mag = data['full_mag']
phase = data['angle']
t = data['t']
freqs = data['freqs']
lmag = data['half_mag']
lfreqs = data['log_freqs']

data = {
    'signal': {
        'y': signal.tolist(),
        'x': t.tolist(),
        'min': _float(np.min(signal)),
        'max': _float(np.max(signal)),
        'avg': _float(np.sum(signal)/signal.size),
        'pmin': _float(p(np.min(signal), np.min(_old))),
        'pmax': _float(p(np.max(signal), np.max(_old))),
        'pavg': _float(p(np.sum(signal)/signal.size,
                         np.sum(_old)/signal.size))
    },
    'fft_mag': {
        'y': mag.tolist(),
        'x': freqs.tolist(),
        'max': _float(np.max(mag)),
        'fmax': _float(data['fmax']),
        'avg': _float(np.sum(mag)/mag.size),
        'pmax': _float(p(np.max(freqs), np.max(old['full_mag']))),
        'pfmax': _float(p(data['fmax'], old['fmax'])),
        'pavg': _float(p(np.sum(mag)/mag.size,
                         np.sum(old['full_mag'])/old['full_mag'].size))
    },
    'fft_phase': {
        'y': phase.tolist(),
        'x': freqs.tolist()
    },
    'fft_log': {
        'y': lmag.tolist(),
        'x': lfreqs.tolist()
    }
}

print(json.dumps(data, sort_keys=True, indent=2))

sys.stdout.flush()
