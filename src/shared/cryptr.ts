import Cryptr from 'cryptr';
import { JWT } from './config';

const cryptr = new Cryptr(JWT.KEY)

export default cryptr
