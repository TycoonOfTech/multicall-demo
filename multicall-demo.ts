import { BigNumber, ethers } from 'ethers';
import { abi as MulticallABI } from '@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json'
import { abi as ERC20_MINIMAL } from '@uniswap/v3-core/artifacts/contracts/interfaces/IERC20Minimal.sol/IERC20Minimal.json'
import { IERC20Metadata } from './types/v3/v3-periphery/artifacts/contracts/interfaces';

import env from 'dotenv'
import { computePoolAddress } from '@uniswap/v3-sdk';
import { getAddress } from "@ethersproject/address";
import { Contract } from '@ethersproject/contracts';
import { AddressZero } from '@ethersproject/constants'
import type { JsonRpcProvider, JsonRpcSigner } from '@ethersproject/providers'
import { Interface } from 'ethers/lib/utils';
import { UniswapInterfaceMulticall } from "./types/v3/UniswapInterfaceMulticall";
import { multipleContractSingleValue } from './rules/mutlipleContractSingleData';
import { isConstructorDeclaration } from 'typescript';
import { IERC20Metadata__factory } from './types/v3/factories/v3-periphery/artifacts/contracts/interfaces';

// import { getAvailableUniPools } from './rules/pool';
//Note: Multicall will throw an error if the contract call exceeds the expected provisioned gas required
// so we jack the number up insanely high to assure execution
const DEFAULT_STATIC_CALL_GAS_REQUIRED = 1_000_000_000_000;
export type MappedCallResponse<T> = [
    BigNumber,
    ([boolean, BigNumber, string] & {
      success: boolean;
      gasUsed: BigNumber;
      returnData: string;
    })[]
  ] & {
    blockNumber: BigNumber;
    returnData: ([boolean, BigNumber, string] & {
      success: boolean;
      gasUsed: BigNumber;
      returnData: T;
    })[];
  }

const ERC20_Interface = IERC20Metadata__factory.createInterface();

export type CallResponse = MappedCallResponse<string>

export type MethodArg = string | number | BigNumber;
export type MethodArgs = Array<MethodArg | MethodArg[]>;
type OptionalMethodInputs =
  | Array<MethodArg | MethodArg[] | undefined>
  | undefined;

  function isMethodArg(x: unknown): x is MethodArg {
    return (
      BigNumber.isBigNumber(x) || ['string', 'number'].indexOf(typeof x) !== -1
    );
  }
  
  function isValidMethodArgs(x: unknown): x is MethodArgs | undefined {
    return (
      x === undefined ||
      (Array.isArray(x) &&
        x.every(
          (xi) => isMethodArg(xi) || (Array.isArray(xi) && xi.every(isMethodArg)),
        ))
    );
  }

const Tokens = [
    {address: '0xD6DF932A45C0f255f85145f286eA0b292B21C90B', name: 'AAVE'},
    {address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', name: 'DAI'},
    {address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', name: 'USDT'},
    {address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6', name: 'WBTC'},
    {address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', name: 'WMatic'} 
]

env.config();

const mutlicallDemo = async () => {

    const INFURA_URL_MAINNET = process.env.INFURA_URL_MAINNET
    const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_MAINNET);
    const multicallAddress =  '0x1F98415757620B543A52E61c46B32eB19261F984'
    // [SupportedExchanges.Uniswap]: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
    
    const multicallContract = getMulticallContract(multicallAddress, MulticallABI, provider);
    const decimalResponse = await multipleContractSingleValue<[BigNumber]>(multicallContract, Tokens.map(x => x.address), ERC20_Interface, 'decimals')
    
    Tokens.map((token, i) => console.log(`Token ${token.name} decimals: ${decimalResponse.returnData[i].returnData}`));
}





export function getMulticallContract(address: string, abi: any, provider: JsonRpcProvider): UniswapInterfaceMulticall { 
    return getContract(address, abi, provider, undefined) as UniswapInterfaceMulticall;
}

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
    try {
      return getAddress(value)
    } catch {
      return false
    }
  }

export function getContract<T extends Contract = Contract>(address: string, ABI: any, provider: JsonRpcProvider, account?: string): Contract {
    if (!isAddress(address) || address === AddressZero) {
      throw Error(`Invalid 'address' parameter '${address}'.`)
    }
  
    return new Contract(address, ABI, getProviderOrSigner(provider, account) as any) as T 
  }
// account is not optional
function getSigner(provider: JsonRpcProvider, account: string): JsonRpcSigner {
    return provider.getSigner(account).connectUnchecked()
  }
  
  // account is optional
function getProviderOrSigner(provider: JsonRpcProvider, account?: string): JsonRpcProvider | JsonRpcSigner {
    return account ? getSigner(provider, account) : provider
  }

mutlicallDemo();

