import type { Principal } from '@dfinity/principal';
export interface NFT {
  'getCanisterID' : () => Promise<Principal>,
  'getImage' : () => Promise<Array<number>>,
  'getName' : () => Promise<string>,
  'getOwner' : () => Promise<Principal>,
  'transferOwnership' : (arg_0: Principal) => Promise<string>,
}
export interface _SERVICE extends NFT {}
