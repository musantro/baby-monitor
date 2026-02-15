.DEFAULT_GOAL := all

IMAGE_NAME ?= baby-monitor
IMAGE_TAG ?= latest
SSL_DIR ?= .ssl
SSL_SOURCE ?= /etc/ssl/certs
COPY_SELF_SIGNED ?= 0

.PHONY: install all

install:
	@mkdir -p "$(SSL_DIR)"
	@if [ "$(COPY_SELF_SIGNED)" = "1" ]; then \
		find "$(SSL_DIR)" -mindepth 1 ! -name ".gitkeep" -delete; \
		cp -r "$(SSL_SOURCE)"/* "$(SSL_DIR)/"; \
		echo "Copied certificates from $(SSL_SOURCE) to $(SSL_DIR)"; \
	else \
		echo "Skipping certificate copy (set COPY_SELF_SIGNED=1 to enable)"; \
	fi
	@npm ci

all: install
	@docker build -t "$(IMAGE_NAME):$(IMAGE_TAG)" .
