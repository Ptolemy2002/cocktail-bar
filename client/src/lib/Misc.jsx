import { useEffect } from 'react';

export function listInPlainEnglish(list, max) {
    if (list.length === 0) {
        return '';
    }
    if (list.length === 1) {
        return list[0];
    }
    if (list.length === 2) {
        return `${list[0]} and ${list[1]}`;
    }

    list = list.map((v, i) => {
        if (i === list.length - 1) return v;
        
        if (v.endsWith(`"`)) {
            return v.slice(0, -2) + `," `;
        } else if (v.endsWith(`'`)) {
            return v.slice(0, -2) + `,' `;
        } else {
            return v + ', ';
        }
    })

    if (max !== undefined && list.length > max) {
        return `${list.slice(0, max).join('')}and ${list.length - max} more`;
    } else {
        return `${list.slice(0, -1).join('')}and ${list[list.length - 1]}`;
    }
}

export function useMountEffect(callback) {
    useEffect(callback, []); // eslint-disable-line react-hooks/exhaustive-deps
}

export function combineClassNames(...classNames) {
    return classNames.filter(c => c).join(' ');
}