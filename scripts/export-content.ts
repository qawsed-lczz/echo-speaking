import fs from 'node:fs';
import path from 'node:path';
import { allSentences, plainText } from '../src/data/curriculum';
import { passages, passageText } from '../src/data/passages';

const items = [
  ...allSentences.map((sentence) => ({
    id: sentence.id,
    kind: 'sentence' as const,
    text: plainText(sentence.text),
  })),
  ...passages.map((passage) => ({
    id: passage.id,
    kind: 'passage' as const,
    text: passageText(passage),
  })),
];

const outDir = path.resolve('audio');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'items.json'), JSON.stringify(items, null, 2), 'utf8');
console.log(`exported ${items.length} items (${allSentences.length} sentences, ${passages.length} passages)`);
