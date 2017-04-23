"""Script to interface with Etch-a-Sketch

Author:     Zander Blasingame
Class:      EE 316
"""

import pygame
import serial
import random
import threading
import sys
import os


# connect to serial
while True:
    try:
        ser = serial.Serial('/dev/ttyUSB0', baudrate=115200)
    except serial.SerialException as err:
        print('ERROR: {}'.format(err))
    else:
        print('Connected to /dev/ttyUSB0')
        ser.write(b'X')
        break

# grab initial points
while ser.read() != b'D':
    pass

x = int(ser.read()[0])
y = int(ser.read()[0])
_x = x
_y = y
can_draw_point = False

# for data collection
xs = []
ys = []

color = (0, 0, 0)
width = 1
size = 1
byte_buffer = ''
character_buffer = ''

# initialize display variables
pygame.init()
screen = pygame.display.set_mode([800, 800])
pygame.display.set_caption('Etch-a-Sketch')
screen.fill((0, 0, 0))

draw_screen = dict(surface=pygame.Surface((256, 256)))
draw_screen['rect'] = draw_screen['surface'].get_rect()
draw_screen['rect'].center = (400, 300)
draw_screen['surface'].fill((255, 255, 255))

draw_screen_2x = dict(surface=pygame.Surface((512, 512)))
draw_screen_2x['rect'] = draw_screen_2x['surface'].get_rect()
draw_screen_2x['rect'].center = (400, 300)


# function to manage threads
def collect_data():
    global ser
    global _x, _y, x, y
    global color, width, size

    while True:
        data_byte = ser.read()

        if data_byte == b'D':
            _x = x
            _y = y
            x = ser.read()[0]
            y = ser.read()[0]

            pygame.draw.line(draw_screen['surface'], color, [_x, _y],
                             [x, y], width)

        elif data_byte == b'E':
            print('Erase')
            draw_screen['surface'].fill((255, 255, 255))

        elif data_byte == b'S':
            print('Screen')
            os.system('scrot -u capture.png')

        elif data_byte == b'C':
            print('Updated Settings')
            r = ser.read()[0]
            g = ser.read()[0]
            b = ser.read()[0]
            color = (r, g, b)

            bits = '{0:08b}'.format(ser.read()[0])
            size = int(bits[0:4], 2)
            width = int(bits[5:9], 2)
            if width < 1:
                width = 1
            elif width > 7:
                width = 7


thread = threading.Thread(target=collect_data)
thread.start()

# fonts
font = pygame.font.Font('/usr/share/fonts/TTF/SourceCodePro-Regular.ttf', 20)

disp_texts = []
for i in range(3):
    disp_text = dict(surface=font.render('Hello', 1, (255, 255, 255)))
    disp_text['rect'] = disp_text['surface'].get_rect()
    disp_text['rect'].left = 50
    disp_text['rect'].bottom = 650 + i*50
    disp_texts.append(disp_text)

disp_str = []
disp_str.append('Character Buffer: {0}')
disp_str.append('X: {0}, Y: {1}')
disp_str.append('Size: {0}x{0} | Color: {1} | Width: {2}')


# start display
while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            sys.exit()
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_f:
                os.system('scrot -u capture.png')
            if event.key == pygame.K_s:
                size = 1 if size != 1 else 2
            if event.key == pygame.K_q:
                sys.exit()

    # update text
    disp_texts[0]['surface'] = font.render(disp_str[0].format(
        'Blah'
    ), 1, (255, 255, 255))
    disp_texts[1]['surface'] = font.render(disp_str[1].format(
        int(x),
        int(y)
    ), 1, (255, 255, 255))
    disp_texts[2]['surface'] = font.render(disp_str[2].format(
        256 if size == 1 else 512,
        color,
        width
    ), 1, (255, 255, 255))

    # draw to screen
    screen.fill((0, 0, 0))

    if size == 1:
        screen.blit(draw_screen['surface'], draw_screen['rect'])
    else:
        pygame.transform.scale2x(draw_screen['surface'],
                                 draw_screen_2x['surface'])
        screen.blit(draw_screen_2x['surface'], draw_screen_2x['rect'])

    for i in range(3):
        screen.blit(disp_texts[i]['surface'], disp_texts[i]['rect'])

    pygame.display.flip()
