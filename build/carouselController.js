import { __extends } from "tslib";
import Carousel from './types';
var CarouselController = (function (_super) {
    __extends(CarouselController, _super);
    function CarouselController(options) {
        var _this = _super.call(this, options) || this;
        _this.build();
        return _this;
    }
    CarouselController.prototype.build = function () {
        var _a = this.properties, container = _a.container, perPage = _a.perPage, frame = _a.frame;
        var widths = this.model.widths;
        var leftOffset = this.model.leftOffset;
        var containerWidth = 0;
        var frames = new DocumentFragment();
        for (var i = frame - perPage; i < frame + 2 * perPage; i += 1) {
            var el = this.createFrame(i);
            el.style.transform = "translateX(" + leftOffset + "px)";
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
        if (!loop && (newFrame < 0 || newFrame > items.length - perPage)) {
            throw Error('Cannot slide outside of range');
        }
        var fragment = new DocumentFragment();
        var leftOffset = this.model.leftOffset;
        for (var i = Math.min(0, delta); i < Math.max(0, delta); i += 1) {
            var el = this.createFrame(frame + i - delta);
            if (delta > 0) {
                el.style.transform = "translateX(" + leftOffset + "px)";
            }
            else {
                el.style.transform = "translateX(" + -2 * leftOffset + "px)";
                leftOffset -= widths[this.currentSlide(i)];
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
                if (perPage <= i + Math.min(0, delta) && i + Math.min(0, delta) <= perPage * 2 - 1) {
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
    CarouselController.prototype.destroy = function () {
        var _this = this;
        clearTimeout(this.model.timingLock);
        this.properties.container.innerHTML = '';
        this.model.items.forEach(function (el) { return _this.properties.container.appendChild(el); });
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
        var leftOffset = this.model.leftOffset + delta;
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
    return CarouselController;
}(Carousel));
export default CarouselController;
//# sourceMappingURL=carouselController.js.map