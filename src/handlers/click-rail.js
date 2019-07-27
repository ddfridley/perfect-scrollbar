import updateGeometry from '../update-geometry';
import ScrollType from '../lib/scroll-type'

export default function(i) {
  const element = i.element;

  i.event.bind(i.scrollbarY, 'mousedown', e => e.stopPropagation());
  i.event.bind(i.scrollbarYRail, 'mousedown', e => {
    const positionTop =
      e.pageY -
      window.pageYOffset -
      i.scrollbarYRail.getBoundingClientRect().top;
    const direction = positionTop > i.scrollbarYTop ? 1 : -1;

    ScrollType.scrollTop(i.element,ScrollType.scrollTop(i.element)+(direction * i.containerHeight))
    updateGeometry(i);

    e.stopPropagation();
  });

  i.event.bind(i.scrollbarX, 'mousedown', e => e.stopPropagation());
  i.event.bind(i.scrollbarXRail, 'mousedown', e => {
    const positionLeft =
      e.pageX -
      window.pageXOffset -
      i.scrollbarXRail.getBoundingClientRect().left;
    const direction = positionLeft > i.scrollbarXLeft ? 1 : -1;

    ScrollType.scrollLeft(element,ScrollType.scrollLeft(element) + (direction * i.containerWidth));
    updateGeometry(i);

    e.stopPropagation();
  });
}
