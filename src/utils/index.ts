interface CovidElementMapper {
    '.confirmed-total': HTMLSpanElement
    '.deaths': HTMLParagraphElement
    '.recovered': HTMLParagraphElement
    '.last-updated-time': HTMLParagraphElement
    '.rank-list': HTMLOListElement
    '.deaths-list': HTMLOListElement
    '.recovered-list': HTMLOListElement
    '#lineChart': HTMLCanvasElement
}

// utils
export function elementSelector<K extends keyof CovidElementMapper>(selector: K): CovidElementMapper[K] | null {
    return document.querySelector(selector)
}
