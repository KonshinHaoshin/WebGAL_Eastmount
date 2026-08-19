import { describe, expect, test } from 'vitest';
import SceneParser, { ADD_NEXT_ARG_LIST, SCRIPT_CONFIG } from '../src/index';
import { commandType } from '../src/interface/sceneInterface';

const parser = new SceneParser(() => {}, (name) => name, ADD_NEXT_ARG_LIST, SCRIPT_CONFIG);

describe('Dragonspring custom command compatibility', () => {
  const commands = [
    'manopedia:open;',
    'addItem:badge -itemId=badge -count=2;',
    'Item:badge -show -left;',
    'clearItem:;',
    'showItem:badge;',
    'pediaUpdate:badge;',
    'presentTheEvidence:badge -target=badge -success=ok.txt -failure=fail.txt;',
    'thinking:choice.json;',
    'judgment:begins -timer=00:30:000 -timeout=timeout.txt;',
    'testimony:statement -refutes={"word":"target"} -colors={"word":"#fff"};',
    'clearTestimony:;',
    'refute:objection.webm -goto=next;',
  ];

  test.each(commands)('parses %s', (source) => {
    const sentence = parser.parse(source, 'custom', '/custom.txt').sentenceList[0];
    expect(sentence.commandRaw).toBe(source.slice(0, source.indexOf(':')));
    expect(sentence.command).toBe(commandType[sentence.commandRaw as keyof typeof commandType]);
    expect(sentence.inlineComment).toBe('');
  });

  test('preserves evidence and testimony structured arguments', () => {
    const result = parser.parse(`${commands[6]}\n${commands[9]}`, 'custom', '/custom.txt').sentenceList;
    expect(result[0].args.map(({ key }) => key)).toEqual(expect.arrayContaining(['target', 'success', 'failure']));
    expect(result[1].args.find(({ key }) => key === 'refutes')?.value).toBe('{"word":"target"}');
    expect(result[1].args.find(({ key }) => key === 'colors')?.value).toBe('{"word":"#fff"}');
  });

  test('preserves legacy Mano, LUT and blinds parameters', () => {
    const result = parser.parse(
      'changeFigure:character.json?type=webgal_mano -pose={ArmL1,Cry} -lut=warm.png;\n' +
        'changeBg:court.png -type=blinds -lut=cold.png;',
      'custom',
      '/custom.txt',
    ).sentenceList;

    expect(result[0].content).toBe('character.json?type=webgal_mano');
    expect(result[0].args.find(({ key }) => key === 'pose')?.value).toBe('{ArmL1,Cry}');
    expect(result[0].args.find(({ key }) => key === 'lut')?.value).toBe('warm.png');
    expect(result[1].args.find(({ key }) => key === 'type')?.value).toBe('blinds');
    expect(result[1].args.find(({ key }) => key === 'lut')?.value).toBe('cold.png');
  });
});
