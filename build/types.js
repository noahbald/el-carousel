import { __assign } from "tslib";
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
        this.properties = __assign(__assign({}, this.properties), options);
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
export default Carousel;
//# sourceMappingURL=types.js.map