function createEvent(name) {
    if (typeof window.CustomEvent === 'function') {
      return new CustomEvent(name);
    } else {
      const evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(name, false, false, undefined);
      return evt;
    }
  }
  
const ScrollType={
    default: {
        scrollTop: (element,value)=>{if(typeof value!=='undefined') element.scrollTop=value; else return element.scrollTop},
        scrollHeight: (element)=>element.scrollHeight,
        scrollWidth: (element)=>element.scrollWidth,
        scrollLeft: (element,value)=>{if(typeof value!=='undefined') element.scrollLeft=value; else return element.scrollLeft},
        scrollWidth: (element)=>element.scrollWidth,
        yRailOffset: (element)=>element.scrollHeight,
        yRailLeft: (element)=>element.scrollLeft,
        xRailOffsetLeft: (element)=>element.scrollLeft,
        xRailBottom: (element)=>element.scrollTop,  // as the child scrolls up, the xRail must be moved down so it is alwasy at the bottom of the child window
        addXRail: (element,rail)=>element.appendChild(rail),
        addYRail: (element,rail)=>element.appendChild(rail),
        onScroll: ()=>{},
    },
    useTopAndLeft: {
        scrollTop: (element,value)=>{
            let h;
            if(typeof value!=='undefined') {  // MDN on scrollTop: If set to a value greater than the maximum available for the element, scrollTop settles itself to the maximum value.
                value = Math.round(value);
                if(value>(h=(element.children[0].scrollHeight-element.offsetHeight)))
                    value=h;
                if(value<0) // h above could be -1 if the container size is the same as the content size, and it's not an integer height
                    value=0;
                element.children[0].style.top= -value+'px'
            } else 
                return -Math.round(parseFloat(element.children[0].style.top))||0
        }, 
        scrollHeight: (element)=>element.children[0].scrollHeight, // the scrollHeight of parent will be increased/decreased by the amount of children[0].top get it from the child
        scrollWidth: (element)=>element.children[0].scrollWidth, // the scrollHeight of parent will be increased/decreased by the amount of children[0].top get it from the child
        scrollLeft: (element,value)=>{
            let w;
            if(typeof value!=='undefined') {  // MDN on scrollTop: If set to a value greater than the maximum available for the element, scrollTop settles itself to the maximum value.
                value = Math.round(value);
                if(value>(w=(element.children[0].scrollWidth-element.OffsetWidth)))
                    value=w;
                if(value<0) // w above could be -1 if the container size is the same as the content size, and it's not an integer width
                    value=0;
                element.children[0].style.left= -value+'px'
            } else 
                return -Math.round(parseFloat(element.children[0].style.left))||0
        },
        scrollWidth: (element)=>element.children[0].scrollWidth, // see comment about scrollHeight
        yRailOffset: (element)=>0, // the yRail does not move, only the child div moves.
        yRailLeft: (element)=> 0,
        xRailOffsetLeft: i=> 0, // the yRail does not move, only the child div moves.
        xRailBottom: (element)=>0,  // the xRail does not move, when the child is scrolled, so the bottom is always 0
        addXRail: (element,rail)=>element.appendChild(rail),
        addYRail: (element,rail)=>element.appendChild(rail),
        onScroll: (i)=>i.element.dispatchEvent(createEvent(`scroll`)),  // the onscroll event isn't triggered by scrolling with top
    },
    //scrollTop: (element,value)=>{if(typeof value!=='undefined') element.scrollTop=value; else return element.scrollTop},
    scrollTop: (element,value)=>{
            let h;
            if(typeof value!=='undefined') {  // MDN on scrollTop: If set to a value greater than the maximum available for the element, scrollTop settles itself to the maximum value.
                if(value<0)
                    value=0;
                else if(value>(h=(element.children[0].scrollHeight-Math.ceil(element.getBoundingClientRect().height))))
                    value=h;
                element.children[0].style.top= -Math.ceil(value)+'px'
            } else 
                return -Math.ceil(parseFloat(element.children[0].style.top))||0
        }, 
    //scrollHeight: (element)=>element.scrollHeight,
    scrollHeight: (element)=>element.children[0].scrollHeight, // the scrollHeight of parent will be increased/decreased by the amount of children[0].top get it from the child
    //scrollWidth: (element)=>element.scrollWidth,
    scrollWidth: (element)=>element.children[0].scrollWidth, // the scrollHeight of parent will be increased/decreased by the amount of children[0].top get it from the child
    //scrollLeft: (element,value)=>{if(typeof value!=='undefined') element.scrollLeft=value; else return element.scrollLeft}
    scrollLeft: (element,value)=>{
        let w;
        if(typeof value!=='undefined') {  // MDN on scrollTop: If set to a value greater than the maximum available for the element, scrollTop settles itself to the maximum value.
            if(value<0)
                value=0;
            else if(value>(w=(element.children[0].scrollWidth-Math.ceil(element.getBoundingClientRect().width))))
                value=w;
            element.children[0].style.left= -Math.ceil(value)+'px'
        } else 
            return -Math.ceil(parseFloat(element.children[0].style.left))||0
    },
    //scrollWidth: (element)=>element.scrollWidth,
    scrollWidth: (element)=>element.children[0].scrollWidth, // see comment about scrollHeight
    //yRailOffset: (element)=>(element)=>element.scrollHeight,
    yRailOffset: (element)=>0, // the yRail does not move, only the child div moves.
    //yRailLeft: (element)=>element.scrollLeft,
    yRailLeft: (element)=> 0,
    //xRailOffsetLeft: (element)=>(element)=>element.scrollLeft,
    xRailOffsetLeft: i=> 0, // the yRail does not move, only the child div moves.
    //xRailBottom: (element)=>element.scrollTop,  // as the child scrolls up, the xRail must be moved down so it is alwasy at the bottom of the child window
    xRailBottom: (element)=>0,  // the xRail does not move, when the child is scrolled, so the bottom is always 0
    addXRail: (element,rail)=>element.appendChild(rail),
    //addXRail: (element,rail)=>element.insertBefore(rail,element.children[0]),  // for top scrolling - put the rails before the content so they don't move when the content moves
    addYRail: (element,rail)=>element.appendChild(rail),
    //addYRail: (element,rail)=>element.insertBefore(rail,element.children[1]), // this goes after the XRail (before the content)
    //onScroll: ()=>{},
    onScroll: (i)=>i.element.dispatchEvent(createEvent(`scroll`)),  // the onscroll event isn't triggered by scrolling with top
}
export default ScrollType;
