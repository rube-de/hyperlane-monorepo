// @ts-ignore
import * as asn1 from 'asn1.js';
import { exec } from 'child_process';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Map an async function over a list xs with a given concurrency level
 *
 * @param concurrency number of `mapFn` concurrent executions
 * @param xs list of value
 * @param mapFn mapping function
 */
export async function concurrentMap<A, B>(
  concurrency: number,
  xs: A[],
  mapFn: (val: A, idx: number) => Promise<B>,
): Promise<B[]> {
  let res: B[] = [];
  for (let i = 0; i < xs.length; i += concurrency) {
    const remaining = xs.length - i;
    const sliceSize = Math.min(remaining, concurrency);
    const slice = xs.slice(i, i + sliceSize);
    res = res.concat(
      await Promise.all(slice.map((elem, index) => mapFn(elem, i + index))),
    );
  }
  return res;
}

export function include(condition: boolean, data: any) {
  return condition ? data : {};
}

const EcdsaPubKey = asn1.define('EcdsaPubKey', function (this: any) {
  // parsing this according to https://tools.ietf.org/html/rfc5480#section-2
  this.seq().obj(
    this.key('algo').seq().obj(this.key('a').objid(), this.key('b').objid()),
    this.key('pubKey').bitstr(),
  );
});

export function getEthereumAddress(publicKey: Buffer): string {
  // The public key is ASN1 encoded in a format according to
  // https://tools.ietf.org/html/rfc5480#section-2
  // I used https://lapo.it/asn1js to figure out how to parse this
  // and defined the schema in the EcdsaPubKey object
  const res = EcdsaPubKey.decode(publicKey, 'der');
  let pubKeyBuffer: Buffer = res.pubKey.data;

  // The public key starts with a 0x04 prefix that needs to be removed
  // more info: https://www.oreilly.com/library/view/mastering-ethereum/9781491971932/ch04.html
  pubKeyBuffer = pubKeyBuffer.slice(1, pubKeyBuffer.length);

  const address = ethers.utils.keccak256(pubKeyBuffer); // keccak256 hash of publicKey
  const EthAddr = `0x${address.slice(-40)}`; // take last 20 bytes as ethereum adress
  return EthAddr;
}

export function execCmd(
  cmd: string,
  execOptions: any = {},
  rejectWithOutput = false,
  pipeOutput = false,
): Promise<[string, string]> {
  return new Promise((resolve, reject) => {
    if (process.env.VERBOSE === 'true') {
      console.debug('$ ' + cmd);
      pipeOutput = true;
    }

    const execProcess = exec(
      cmd,
      { maxBuffer: 1024 * 10000, ...execOptions },
      (err, stdout, stderr) => {
        if (process.env.VERBOSE === 'true') {
          console.debug(stdout.toString());
        }
        if (err || process.env.VERBOSE === 'true') {
          console.error(stderr.toString());
        }
        if (err) {
          if (rejectWithOutput) {
            reject([err, stdout.toString(), stderr.toString()]);
          } else {
            reject(err);
          }
        } else {
          resolve([stdout.toString(), stderr.toString()]);
        }
      },
    );

    if (pipeOutput) {
      if (execProcess.stdout) {
        execProcess.stdout.pipe(process.stdout);
      }
      if (execProcess.stderr) {
        execProcess.stderr.pipe(process.stderr);
      }
    }
  });
}

export async function execCmdAndParseJson(
  cmd: string,
  execOptions: any = {},
  rejectWithOutput = false,
  pipeOutput = false,
) {
  const [stdout] = await execCmd(
    cmd,
    execOptions,
    rejectWithOutput,
    pipeOutput,
  );
  return JSON.parse(stdout);
}

export const ensure0x = (hexstr: string) =>
  hexstr.startsWith('0x') ? hexstr : '0x' + hexstr;
export const strip0x = (hexstr: string) =>
  hexstr.startsWith('0x') ? hexstr.slice(2) : hexstr;
export function includeConditionally(condition: boolean, data: any) {
  return condition ? data : {};
}

export function log(isTest: boolean, str: string) {
  if (!isTest) {
    console.log(str);
  }
}

export function warn(text: string, padded: boolean = false) {
  if (padded) {
    const padding = '*'.repeat(text.length + 8);
    console.log(
      `
      ${padding}
      *** ${text.toUpperCase()} ***
      ${padding}
      `,
    );
  } else {
    console.log(`**** ${text.toUpperCase()} ****`);
  }
}

export function writeJSON(directory: string, filename: string, obj: any) {
  fs.writeFileSync(
    path.join(directory, filename),
    JSON.stringify(obj, null, 2),
  );
}

// Returns a \ b
// Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#implementing_basic_set_operations
export function setDifference<T>(a: Set<T>, b: Set<T>) {
  let diff = new Set(a);
  for (const element of b) {
    diff.delete(element);
  }
  return diff;
}