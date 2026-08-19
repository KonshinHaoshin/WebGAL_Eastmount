import { ISentence } from '@/Core/controller/scene/sceneInterface';
import { FIGURE_POSITIONS, IFigurePosition } from '@/Core/Modules/stage/stageInterface';
import { toSafeBoolean, toSafeNumber, toSafeString } from './toSafeType';

export function getSentenceArgByKey(sentence: ISentence, argKey: string): null | string | boolean | number {
  const args = sentence.args;
  const result = args.find((arg) => arg.key === argKey);
  if (result) {
    return result.value;
  } else return null;
}

export function getBooleanArgByKey(sentence: ISentence, argKey: string): boolean | null {
  const argValue = getSentenceArgByKey(sentence, argKey);
  return toSafeBoolean(argValue);
}

export function getNumberArgByKey(sentence: ISentence, argKey: string): number | null {
  const argValue = getSentenceArgByKey(sentence, argKey);
  return toSafeNumber(argValue);
}

export function getStringArgByKey(sentence: ISentence, argKey: string): string | null {
  const argValue = getSentenceArgByKey(sentence, argKey);
  return toSafeString(argValue);
}

export function getObjectArgByKey(sentence: ISentence, argKey: string): Record<string, unknown> | null {
  const value = getSentenceArgByKey(sentence, argKey) as unknown;
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== 'string') return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * 从参数中获取立绘的预设位置，没有指定位置时返回空字符串
 */
export function getFigurePositionFromArgs(sentence: ISentence): IFigurePosition | '' {
  return FIGURE_POSITIONS.find((position) => getBooleanArgByKey(sentence, position)) ?? '';
}
