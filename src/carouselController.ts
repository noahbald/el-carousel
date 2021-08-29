import Carousel from './types'
import type { CarouselOptions } from './types'

/**
 * 🎠 El Carousel Controller 🎠
 */
export default class CarouselController extends Carousel {
  /**
   * Create a carousel
   *
   * Turns an container of slides into a carousel with frames, with each frome controlling
   * the visibility and position of the slides
   * @param options
   */
  constructor(options: CarouselOptions) {
    super(options)

    // Add events
    window.addEventListener('resize', this.$handleResize)

    // Build frame
    this.build()
  }

  /**
   * Turn the slides in `properties.items` into frames to be displayed in the Carousel
   */
  private build() {
    const {
      container,
      perPage,
      frame,
    } = this.properties
    const { widths } = this.model
    let { leftOffset } = this
    let containerWidth = 0

    // Create starting frames
    const frames = new DocumentFragment()
    for (let i = frame - widths.length; i < frame + perPage + widths.length; i += 1) {
      const el = this.createFrame(i)
      // Position frame
      el.style.transform = `translateX(${leftOffset}px)`
      if (frame <= i && i < frame + perPage) {
        el.classList.remove('out')
        el.classList.add('in')
      }
      leftOffset += widths[this.currentSlide(frame + i)]
      containerWidth += i >= 0 && i < perPage // Set container to widths of children
        ? widths[this.currentSlide(frame + i)]
        : 0
      frames.appendChild(el)
    }

    // Place frames into container
    container.innerHTML = '' // Remove slides to replace with frames
    container.appendChild(frames)
    container.style.width = `${containerWidth}px`
    container.classList.remove('building') // Remove loading styles if there are any
  }

  /**
   * Moves the frames around to place the frame at `index` as the first visible frame
   * @param newIndex The target index which the first visible slide will be set to
   * @example carousel.slideTo(3)
   * @throws if trying to slide outside of range when looping is
   */
  slideTo(newFrame: number) {
    const {
      frame,
      loop,
      perPage,
      container,
      timingDuration,
    } = this.properties
    const { items, widths, timingLock } = this.model

    // Assertions
    if (timingLock) {
      // Patience, we can't slide while already sliding
      return
    }
    const delta = newFrame - frame
    if (delta === 0) {
      // Nothing changed :/
      return
    }
    if (!loop && (frame - delta < 0 || frame - delta > items.length - perPage)) {
      throw Error('Cannot slide outside of range')
    }

    // Create entering frames
    const fragment = new DocumentFragment()
    let { leftOffset } = this
    for (let i = Math.min(0, delta); i < Math.max(0, delta); i += 1) {
      const el = this.createFrame(frame + i - delta)
      if (delta > 0) {
        el.style.transform = `translateX(${leftOffset}px)` // FIXME: Place before all other elements
      } else {
        el.style.transform = `translateX(${-2 * leftOffset}px)`
        leftOffset -= widths[
          this.currentSlide(frame + i - delta)
        ] // FIXME: Place after all other elements
      }
      fragment.appendChild(el)
    }

    // Insert frames and queue removal of exiting frames
    let toRemove: Element[]
    if (delta > 0) {
      container.insertBefore(fragment, container.firstChild)
      toRemove = Array.from(container.children).filter(
        (item, i) => i >= container.children.length - delta,
      )
    } else if (delta < 0) {
      container.appendChild(fragment)
      toRemove = Array.from(container.children).filter(
        (item, i) => i < -delta,
      )
    }

    // Handle elements once the transition is done
    container.classList.add('transitioning')
    this.model.timingLock = window.setTimeout(() => {
      toRemove.forEach((el) => el.remove())
      this.model.timingLock = undefined
      container.classList.remove('transitioning')
    }, timingDuration)

    // Move frames into place
    for (let i = 0; i < container.children.length; i += 1) {
      const child = container.children[i]
      if (child instanceof HTMLElement) {
        // Set position
        child.style.transform = `translateX(${leftOffset}px)`
        leftOffset += child.offsetWidth
        // Set whether in or out of view
        if (
          widths.length <= i + Math.min(0, delta)
          && i + Math.min(0, delta) <= widths.length + perPage - 1
        ) {
          child.classList.add('in')
          child.classList.remove('out')
        } else {
          child.classList.add('out')
          child.classList.remove('in')
        }
      }
    }

    // Finally, update the index (FIXME: it's the opposite direction to `newFrame`)
    this.properties.frame -= delta
  }

  /**
   * Gets the index of the original slide that the given frame refers to
   *
   * i.e, maps `frame` to range `[0, slides.length]`
   * @param frame The index of the first visible element
   * @returns The index of the element from the original items
   * @example
   * // There's 3 slides
   * carousel.currentSlide(1) // Returns 1
   * carousel.currentSlide(3) // Returns 0
   * carousel.currentSlide(-3) // Returns 0
   * carousel.currentSlide(-7) // Returns 2
   */
  currentSlide(frame?: number) {
    // Wrap the index between [0, items.length]
    const { length } = this.model.items
    let i = frame === undefined || Number.isNaN(frame) ? this.properties.frame : frame
    i = i < 0
      ? (Math.ceil((-1 * i) / length) * length) + i
      : i
    return i % length
  }

  /**
   * Prepare a frame for the given index and the slide it refers to
   * @param frame The index of the frame
   * @returns An `HTMLElement` representing the frame, with the slide as it's only child
   */
  private createFrame(frame: number) {
    const { timingDuration } = this.properties
    const { items, widths } = this.model
    const slide = this.currentSlide(frame)
    const item = items[slide]

    const el = document.createElement('div')
    el.classList.add('carousel-slide')
    el.style.width = `${widths[slide]}px`
    if (timingDuration) {
      el.style.transitionProperty = 'all'
      el.style.transitionDuration = `${timingDuration}ms`
    }
    el.classList.add('out') // Start slide as being out, so that it can transition in
    el.appendChild(item.cloneNode(true))
    return el
  }

  doDrag() {
    // Check if we can drag
    if (
      (this.model.timingLock && this.model.timingLock !== -1)
      || !this.properties.draggable
      || !this.drag.pointerDown
    ) {
      return
    }

    const { startX, endX } = this.drag
    const { widths } = this.model
    const { container, frame, timingDuration } = this.properties
    // Offset the position by the amount dragged
    const delta = endX - startX
    let leftOffset = this.leftOffset + delta
    // Move the frames by the drag distance
    for (let i = 0; i < container.children.length; i += 1) {
      const child = container.children[i]
      if (child instanceof HTMLElement) {
        child.classList.add('dragging')
        // Disable transform transition
        child.style.transform = `translateX(${leftOffset}px)`
        child.style.transitionProperty = 'all, transform'
        child.style.transitionDuration = `${timingDuration}ms, 0s`
        // Position element
        leftOffset += widths[this.currentSlide(frame + i)]
      }
    }
  }

  commitDrag() {
    // Check if we can drag
    if (
      (this.model.timingLock && this.model.timingLock !== -1)
      || !this.properties.draggable
      || !this.drag.pointerDown
    ) {
      return
    }

    const { startX, endX } = this.drag
    const { frame, container, timingDuration } = this.properties
    const { widths } = this.model

    // End dragging
    this.drag.pointerDown = false
    this.model.timingLock = undefined

    // Re-enable transform transitions
    for (let i = 0; i < container.children.length; i += 1) {
      const child = container.children[i]
      if (child instanceof HTMLElement) {
        child.style.transitionProperty = 'all'
        child.style.transitionDuration = `${timingDuration}ms`
      }
    }

    // Figure out how many frames to move
    let delta = endX - startX
    if (!delta || Math.abs(delta) < this.properties.dragThreshold) {
      this.changeBy(0)
      return
    }
    let moveBy = 0
    if (delta < 0) {
      // Count the amount of frames we've moved left
      for (let i = frame; delta < 0; i += 1) {
        delta += widths[this.currentSlide(i)]
        moveBy -= 1
      }
    } else if (delta > 0) {
      // Count the amount of frames we've moved right
      for (let i = frame; delta > 0; i -= 1) {
        delta -= widths[this.currentSlide(i)]
        moveBy += 1
      }
    }
    this.changeBy(moveBy)
  }

  destroy() {
    clearTimeout(this.model.timingLock)
    window.removeEventListener('resize', this.$handleResize)

    // Restore container to previous state
    const { container } = this.properties
    const { items } = this.model

    container.innerHTML = ''
    const fragment = document.createDocumentFragment()
    items.forEach((item) => fragment.appendChild(item))
    container.appendChild(fragment)

    container.style.width = ''
  }

  protected handleResize() {
    const { items } = this.model

    // Wait until resizing has ended
    if (!this.resizeLock) {
      this.resizeLock = setTimeout(() => {
        this.destroy()
        window.addEventListener('resize', () => this.handleResize())
        // Build after render, before paint
        requestAnimationFrame(() => {
          this.model.widths = items.map((item) => item.offsetWidth)
          this.build()
          this.resizeLock = undefined
        })
      }, 100)
    }
  }

  private $handleResize = this.handleResize.bind(this)

  private resizeLock?: number
}
