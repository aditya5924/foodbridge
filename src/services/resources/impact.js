import {choose} from '../mode';import {mock} from '../mockAdapter';import {http} from '../http';import {qs} from './query';
export const monthly=choose(month=>mock.impact.monthly(month),month=>http(`/impact/monthly${qs({month})}`));
