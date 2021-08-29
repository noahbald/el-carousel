var CarouselController = (function (tslib) {
    'use strict';

    var Carousel = (function () {
        function Carousel(options) {
            var _this = this;
            this.properties = {
                container: document.createElement('div'),
                frame: 0,
                perPage: 1,
                draggable: true,
                loop: true,
                timingDuration: 200,
                dragThreshold: 100,
            };
            this.drag = {
                pointerDown: false,
                startX: 0,
                endX: 0,
            };
            if (!options.container.children.length) {
                throw Error('Carousel container must contain slides');
            }
            if (!options.loop
                && options.frame
                && (options.frame < 0 || options.frame >= options.container.children.length)) {
                throw Error('Starting frame must be within range of slides if loop is disabled');
            }
            this.properties = tslib.__assign(tslib.__assign({}, this.properties), options);
            var container = this.properties.container;
            var items = Array.from(container.children).filter(function (child) { return child instanceof HTMLElement; });
            var widths = items.map(function (item) { return item.offsetWidth; });
            this.model = {
                items: items,
                widths: widths,
            };
            var draggable = this.properties.draggable;
            if (draggable) {
                container.addEventListener('touchstart', function (e) { return _this.handleTouchStart(e); });
                container.addEventListener('touchmove', function (e) { return _this.handleTouchMove(e); });
                container.addEventListener('touchend', function (e) { return _this.handleTouchEnd(e); });
                container.addEventListener('mousedown', function (e) { return _this.handleMouseDown(e); });
                container.addEventListener('mousemove', function (e) { return _this.handleMouseMove(e); });
                container.addEventListener('mouseleave', function () { return _this.handleMouseLeave(); });
                container.addEventListener('mouseup', function (e) { return _this.handleMouseUp(e); });
                container.addEventListener('click', Carousel.handleClick);
            }
        }
        Object.defineProperty(Carousel.prototype, "leftOffset", {
            get: function () {
                var widths = this.model.widths;
                return -widths.reduce(function (acc, width) { return acc + width; }, 0);
            },
            enumerable: false,
            configurable: true
        });
        Carousel.prototype.changeBy = function (amount) {
            if (amount === void 0) { amount = 1; }
            var _a = this.properties, frame = _a.frame, perPage = _a.perPage, loop = _a.loop;
            var items = this.model.items;
            var newFrame = frame + amount;
            if (!loop) {
                if (frame - amount < 0) {
                    newFrame = 0;
                }
                else if (frame - amount > items.length - perPage) {
                    newFrame = items.length - perPage;
                }
            }
            this.slideTo(newFrame);
        };
        Carousel.prototype.handleTouchStart = function (ev) {
            if (this.notDraggable(ev)) {
                return;
            }
            ev.stopPropagation();
            this.drag = {
                pointerDown: true,
                startX: ev.touches[0].pageX,
                endX: ev.touches[0].pageX,
            };
            this.model.timingLock = -1;
        };
        Carousel.prototype.handleTouchMove = function (ev) {
            if (this.drag.pointerDown) {
                ev.stopPropagation();
                ev.preventDefault();
                this.drag.endX = ev.touches[0].pageX;
                this.doDrag();
            }
        };
        Carousel.prototype.handleTouchEnd = function (ev) {
            if (this.drag.pointerDown) {
                ev.stopPropagation();
                this.commitDrag();
            }
        };
        Carousel.prototype.handleMouseDown = function (ev) {
            if (this.notDraggable(ev)) {
                return;
            }
            ev.preventDefault();
            ev.stopPropagation();
            this.drag = {
                pointerDown: true,
                startX: ev.pageX,
                endX: ev.pageX,
            };
            this.model.timingLock = -1;
        };
        Carousel.prototype.handleMouseMove = function (ev) {
            if (this.drag.pointerDown) {
                ev.stopPropagation();
                ev.preventDefault();
                this.drag.endX = ev.pageX;
                this.doDrag();
            }
        };
        Carousel.prototype.handleMouseUp = function (ev) {
            if (this.drag.pointerDown) {
                ev.stopPropagation();
                this.commitDrag();
            }
        };
        Carousel.prototype.handleMouseLeave = function () {
            this.drag.endX = this.drag.startX;
            this.doDrag();
        };
        Carousel.handleClick = function (ev) {
            if (ev.target instanceof HTMLAnchorElement) {
                ev.preventDefault();
            }
        };
        Carousel.prototype.notDraggable = function (ev) {
            return [
                HTMLInputElement,
                HTMLTextAreaElement,
                HTMLSelectElement,
                HTMLOptionElement,
            ].some(function (T) { return ev.target instanceof T; })
                || (this.model.timingLock && this.model.timingLock !== -1)
                || this.model.timingLock
                || !this.properties.draggable;
        };
        return Carousel;
    }());

    var CarouselController = (function (_super) {
        tslib.__extends(CarouselController, _super);
        function CarouselController(options) {
            var _this = _super.call(this, options) || this;
            _this.$handleResize = _this.handleResize.bind(_this);
            window.addEventListener('resize', _this.$handleResize);
            _this.build();
            return _this;
        }
        CarouselController.prototype.build = function () {
            var _a = this.properties, container = _a.container, perPage = _a.perPage, frame = _a.frame;
            var widths = this.model.widths;
            var leftOffset = this.leftOffset;
            var containerWidth = 0;
            var frames = new DocumentFragment();
            for (var i = frame - widths.length; i < frame + perPage + widths.length; i += 1) {
                var el = this.createFrame(i);
                el.style.transform = "translateX(" + leftOffset + "px)";
                if (frame <= i && i < frame + perPage) {
                    el.classList.remove('out');
                    el.classList.add('in');
                }
                leftOffset += widths[this.currentSlide(frame + i)];
                containerWidth += i >= 0 && i < perPage
                    ? widths[this.currentSlide(frame + i)]
                    : 0;
                frames.appendChild(el);
            }
            container.innerHTML = '';
            container.appendChild(frames);
            container.style.width = containerWidth + "px";
            container.classList.remove('building');
        };
        CarouselController.prototype.slideTo = function (newFrame) {
            var _this = this;
            var _a = this.properties, frame = _a.frame, loop = _a.loop, perPage = _a.perPage, container = _a.container, timingDuration = _a.timingDuration;
            var _b = this.model, items = _b.items, widths = _b.widths, timingLock = _b.timingLock;
            if (timingLock) {
                return;
            }
            var delta = newFrame - frame;
            if (delta === 0) {
                return;
            }
            if (!loop && (frame - delta < 0 || frame - delta > items.length - perPage)) {
                throw Error('Cannot slide outside of range');
            }
            var fragment = new DocumentFragment();
            var leftOffset = this.leftOffset;
            for (var i = Math.min(0, delta); i < Math.max(0, delta); i += 1) {
                var el = this.createFrame(frame + i - delta);
                if (delta > 0) {
                    el.style.transform = "translateX(" + leftOffset + "px)";
                }
                else {
                    el.style.transform = "translateX(" + -2 * leftOffset + "px)";
                    leftOffset -= widths[this.currentSlide(frame + i - delta)];
                }
                fragment.appendChild(el);
            }
            var toRemove;
            if (delta > 0) {
                container.insertBefore(fragment, container.firstChild);
                toRemove = Array.from(container.children).filter(function (item, i) { return i >= container.children.length - delta; });
            }
            else if (delta < 0) {
                container.appendChild(fragment);
                toRemove = Array.from(container.children).filter(function (item, i) { return i < -delta; });
            }
            container.classList.add('transitioning');
            this.model.timingLock = window.setTimeout(function () {
                toRemove.forEach(function (el) { return el.remove(); });
                _this.model.timingLock = undefined;
                container.classList.remove('transitioning');
            }, timingDuration);
            for (var i = 0; i < container.children.length; i += 1) {
                var child = container.children[i];
                if (child instanceof HTMLElement) {
                    child.style.transform = "translateX(" + leftOffset + "px)";
                    leftOffset += child.offsetWidth;
                    if (widths.length <= i + Math.min(0, delta)
                        && i + Math.min(0, delta) <= widths.length + perPage - 1) {
                        child.classList.add('in');
                        child.classList.remove('out');
                    }
                    else {
                        child.classList.add('out');
                        child.classList.remove('in');
                    }
                }
            }
            this.properties.frame -= delta;
        };
        CarouselController.prototype.currentSlide = function (frame) {
            var length = this.model.items.length;
            var i = frame === undefined || Number.isNaN(frame) ? this.properties.frame : frame;
            i = i < 0
                ? (Math.ceil((-1 * i) / length) * length) + i
                : i;
            return i % length;
        };
        CarouselController.prototype.createFrame = function (frame) {
            var timingDuration = this.properties.timingDuration;
            var _a = this.model, items = _a.items, widths = _a.widths;
            var slide = this.currentSlide(frame);
            var item = items[slide];
            var el = document.createElement('div');
            el.classList.add('carousel-slide');
            el.style.width = widths[slide] + "px";
            if (timingDuration) {
                el.style.transitionProperty = 'all';
                el.style.transitionDuration = timingDuration + "ms";
            }
            el.classList.add('out');
            el.appendChild(item.cloneNode(true));
            return el;
        };
        CarouselController.prototype.doDrag = function () {
            if ((this.model.timingLock && this.model.timingLock !== -1)
                || !this.properties.draggable
                || !this.drag.pointerDown) {
                return;
            }
            var _a = this.drag, startX = _a.startX, endX = _a.endX;
            var widths = this.model.widths;
            var _b = this.properties, container = _b.container, frame = _b.frame, timingDuration = _b.timingDuration;
            var delta = endX - startX;
            var leftOffset = this.leftOffset + delta;
            for (var i = 0; i < container.children.length; i += 1) {
                var child = container.children[i];
                if (child instanceof HTMLElement) {
                    child.classList.add('dragging');
                    child.style.transform = "translateX(" + leftOffset + "px)";
                    child.style.transitionProperty = 'all, transform';
                    child.style.transitionDuration = timingDuration + "ms, 0s";
                    leftOffset += widths[this.currentSlide(frame + i)];
                }
            }
        };
        CarouselController.prototype.commitDrag = function () {
            if ((this.model.timingLock && this.model.timingLock !== -1)
                || !this.properties.draggable
                || !this.drag.pointerDown) {
                return;
            }
            var _a = this.drag, startX = _a.startX, endX = _a.endX;
            var _b = this.properties, frame = _b.frame, container = _b.container, timingDuration = _b.timingDuration;
            var widths = this.model.widths;
            this.drag.pointerDown = false;
            this.model.timingLock = undefined;
            for (var i = 0; i < container.children.length; i += 1) {
                var child = container.children[i];
                if (child instanceof HTMLElement) {
                    child.style.transitionProperty = 'all';
                    child.style.transitionDuration = timingDuration + "ms";
                }
            }
            var delta = endX - startX;
            if (!delta || Math.abs(delta) < this.properties.dragThreshold) {
                this.changeBy(0);
                return;
            }
            var moveBy = 0;
            if (delta < 0) {
                for (var i = frame; delta < 0; i += 1) {
                    delta += widths[this.currentSlide(i)];
                    moveBy -= 1;
                }
            }
            else if (delta > 0) {
                for (var i = frame; delta > 0; i -= 1) {
                    delta -= widths[this.currentSlide(i)];
                    moveBy += 1;
                }
            }
            this.changeBy(moveBy);
        };
        CarouselController.prototype.destroy = function () {
            clearTimeout(this.model.timingLock);
            window.removeEventListener('resize', this.$handleResize);
            var container = this.properties.container;
            var items = this.model.items;
            container.innerHTML = '';
            var fragment = document.createDocumentFragment();
            items.forEach(function (item) { return fragment.appendChild(item); });
            container.appendChild(fragment);
            container.style.width = '';
        };
        CarouselController.prototype.handleResize = function () {
            var _this = this;
            var items = this.model.items;
            if (!this.resizeLock) {
                this.resizeLock = setTimeout(function () {
                    _this.destroy();
                    window.addEventListener('resize', function () { return _this.handleResize(); });
                    requestAnimationFrame(function () {
                        _this.model.widths = items.map(function (item) { return item.offsetWidth; });
                        _this.build();
                        _this.resizeLock = undefined;
                    });
                }, 100);
            }
        };
        return CarouselController;
    }(Carousel));

    return CarouselController;

}(tslib));
