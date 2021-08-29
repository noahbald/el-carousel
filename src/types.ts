type Slide = number
type Frame = number

export type CarouselOptions = {
  container: HTMLElement,
  frame?: Frame,
  perPage?: number,
  draggable?: boolean,
  loop?: boolean,
  timingDuration?: number,
  dragThreshold?: number,
}
export type CarouselModel = {
  items: HTMLElement[],
  widths: number[],
  timingLock?: number, // Timeout ID
}
type dragProperties = {
  pointerDown: boolean,
  startX: number,
  endX: number,
}

/**
 * 🎠 El Carousel 🎠
 */
export default abstract class Carousel {
  protected properties: Required<CarouselOptions> = {
    container: document.createElement('div'),
    frame: 0,
    perPage: 1,
    draggable: true,
    loop: true,
    timingDuration: 200,
    dragThreshold: 100,
  }

  protected drag: dragProperties = {
    pointerDown: false,
    startX: 0,
    endX: 0,
  }

  protected model: CarouselModel

  /**
  * Create a carousel
  *
  * Turns an container of slides into a carousel with frames, with each frome controlling
  * the visibility and position of the slides
  * @param options
  * @throws if container is empty
  * @throws if loop is disabled and starting frame is outside of the range of slides
  */
  constructor(options: CarouselOptions) {
    // Assert options
    if (!options.container.children.length) {
      throw Error('Carousel container must contain slides')
    }
    if (
      !options.loop
      && options.frame
      && (options.frame < 0 || options.frame >= options.container.children.length)) {
      throw Error('Starting frame must be within range of slides if loop is disabled')
    }

    // Apply options
    this.properties = { ...this.properties, ...options }

    // Create model
    const { container } = this.properties
    const items = Array.from(container.children).filter(
      (child) => child instanceof HTMLElement,
    ) as HTMLElement[]
    const widths = items.map((item) => item.offsetWidth)
    this.model = {
      items,
      widths,
    }

    // Attach events
    const { draggable } = this.properties
    if (draggable) {
      // Touch Events
      container.addEventListener('touchstart', (e) => this.handleTouchStart(e))
      container.addEventListener('touchmove', (e) => this.handleTouchMove(e))
      container.addEventListener('touchend', (e) => this.handleTouchEnd(e))

      // Mouse Events
      container.addEventListener('mousedown', (e) => this.handleMouseDown(e))
      container.addEventListener('mousemove', (e) => this.handleMouseMove(e))
      container.addEventListener('mouseleave', () => this.handleMouseLeave())
      container.addEventListener('mouseup', (e) => this.handleMouseUp(e))

      // Click
      container.addEventListener('click', Carousel.handleClick)
    }
  }

  protected get leftOffset() {
    const { widths } = this.model
    return -widths.reduce((acc, width) => acc + width, 0)
  }

  /**
   * Changes the position of the slides by the given number
   * @param amount How many frames to go right by; negative to go left
   * @example
   * carousel.changeBy(1) // Move slides 1 to the right
   * carousel.changeBy(-2) // Move slides 2 to the left
   */
  changeBy(amount: number = 1) {
    const { frame, perPage, loop } = this.properties
    const { items } = this.model

    let newFrame = frame + amount
    if (!loop) {
      if (frame - amount < 0) {
        newFrame = 0
      } else if (frame - amount > items.length - perPage) {
        newFrame = items.length - perPage
      }
    }
    this.slideTo(newFrame)
  }

  /**
   * Moves the frames around to place the frame at `index` as the first visible frame
   * @param newIndex The target index which the first visible slide will be set to
   * @example carousel.slideTo(3)
   */
  // eslint-disable-next-line no-unused-vars
  abstract slideTo(frame?: Frame): void

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
  // eslint-disable-next-line no-unused-vars
  abstract currentSlide(frame?: Frame): Slide

  abstract destroy(): void

  /**
   * Begin dragging with touch
   * @param ev
   * @returns
   */
  private handleTouchStart(ev: TouchEvent) {
    if (this.notDraggable(ev)) {
      return
    }

    ev.stopPropagation()
    this.drag = {
      pointerDown: true,
      startX: ev.touches[0].pageX,
      endX: ev.touches[0].pageX,
    }
    this.model.timingLock = -1
  }

  private handleTouchMove(ev: TouchEvent) {
    if (this.drag.pointerDown) {
      ev.stopPropagation()
      ev.preventDefault()

      this.drag.endX = ev.touches[0].pageX
      this.doDrag()
    }
  }

  private handleTouchEnd(ev: TouchEvent) {
    if (this.drag.pointerDown) {
      ev.stopPropagation()
      this.commitDrag()
    }
  }

  private handleMouseDown(ev: MouseEvent) {
    if (this.notDraggable(ev)) {
      return
    }

    ev.preventDefault()
    ev.stopPropagation()
    this.drag = {
      pointerDown: true,
      startX: ev.pageX,
      endX: ev.pageX,
    }
    this.model.timingLock = -1
  }

  private handleMouseMove(ev: MouseEvent) {
    if (this.drag.pointerDown) {
      ev.stopPropagation()
      ev.preventDefault()

      this.drag.endX = ev.pageX
      this.doDrag()
    }
  }

  private handleMouseUp(ev: MouseEvent) {
    if (this.drag.pointerDown) {
      ev.stopPropagation()
      this.commitDrag()
    }
  }

  private handleMouseLeave() {
    this.drag.endX = this.drag.startX
    this.doDrag()
  }

  private static handleClick(ev: MouseEvent) {
    if (ev.target instanceof HTMLAnchorElement) {
      ev.preventDefault()
    }
  }

  /**
   * Returns whether the carousel should be allowed to drag or not
   * @param ev
   * @returns
   */
  private notDraggable(ev: Event) {
    return [
      HTMLInputElement,
      HTMLTextAreaElement,
      HTMLSelectElement,
      HTMLOptionElement,
    ].some((T) => ev.target instanceof T)
    || (this.model.timingLock && this.model.timingLock !== -1)
    || this.model.timingLock
    || !this.properties.draggable
  }

  /**
   * Move the carousel around while it is being dragged
   */
  protected abstract doDrag(): void

  /**
   * Update the carousel once it is finished being dragged
   */
  protected abstract commitDrag(): void
}
