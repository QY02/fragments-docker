#!/bin/bash
socat TCP-LISTEN:7861,fork TCP:127.0.0.1:7860 &
cd /home/user && gradio app.py
