# 🎠 El Carousel 🎠

A simple carousel that just does the carousel stuff.

* Written in vanilla TypeScript with zero dependencies
* Compatable with ES5+
* Lightweight
* Configurable
* 2kb gzipped

## Getting Started
Use the Carousel Controller to turn any element of slides into a basic carousel. Style and modify what you want from there!

You can add your own controls with dots, buttons, or whatever you like!

``` typescript
// A carousel that automatically slides every 2s
const el = document.getElementById('carousel')
const controller = new CarouselController({
    container: el,
    perPage: 3,
    timingDuration: 200,
})

setInterval(() => controller.changeBy(1), 2000)
```
``` scss
.carousel {
    position: relative;
    justify-content: center;
    align-items: center;

    .carousel-slide {
        position: absolute;
        transition-timing-function: ease-in-out;

        &.in {
            opacity: 1;
        }
        &.out {
            opacity: 0;
        }
    }

    &:not(.transitioning):not(.dragging) .carousel-slide.out {
        display: none;
    }
}
```

### Terminology
* **`Slides`**: The original children of the carousel
* **`Frames`**: The copies of the slides which the carousel moves around

## Options
**`container`** — HTML Element

The element to be turned into a carousel. It's children will be used as slides to create the frames of the carousel.

**`frame = 0`** — number

Which frame is to be displayed first

**`perPage = 1`** — number

The amount of frames to have `.in` at a time

**`draggable = true`** — boolean

Whether the user can use their mouse or touchscreen to move and change the slides

**`loop = true`** — boolean

Whether the carousel can repeat itself indefinitely. Setting this to false will limit `frame` to be within `[0, slides.length)`

**`timingDuration = 200`** — number

The amount of milliseconds that it will take for the slides to transition, as well as the delay until exiting frames are removed.

**`dragThreshold = 100`** — number

The amount of `px` that the user must drag before the carousel is allowed to move frames

## Methods

**`changeBy(amount: number = 1): void`**

Moves the frames of the carousel by the given amount.

* `amount > 0`: Move frames to the right
* `amount < 0`: Move frames to the left

**`slideTo(frame: number): void`**

Moves the frames so that the given frame is the first in the carousel

**`currentSlide(frame?: number)`**

Returns the index of the slide which the given frame represents.

If no frame is given, it returns the first `.in` frame of the carousel

**`destroy(): void`**

Returns the carousel to the container's original state

## Thanks to

This module is mostly based off [Siema](https://github.com/pawelgrzybek/siema), which is no longer maintained due to Carousels being an anti-pattern.

Generally,
* Carousels perform poorly in click-through-rates and marketing
* Automatic carousels may frustrate and be ignored by users
* Carousels negatively affect accessibility

However, carousels are still widely used to display the content the user visits a site for, and are often used when there is precedent for a carousel to benefit the user.

El Carousel aims to provide you with the ability to make a carousel with as little, or as much of a footprint as you want.
