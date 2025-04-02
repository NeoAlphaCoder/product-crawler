import { readFileSync } from 'fs';

const messages = JSON.parse(
  readFileSync(new URL('../constants/responseMessage.json', import.meta.url), 'utf-8')
);


export default messages;