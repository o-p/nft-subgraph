import { Address, BigInt, log } from '@graphprotocol/graph-ts'

import { Account, NFT, NFTContract } from '../generated/schema'
import { ERC721, Transfer } from '../generated/NFT/ERC721'
import { TransferSingle, TransferBatch } from '../generated/NFT/ERC1155'

import { normalize } from './helpers'

export function handleERC721Transfer(event: Transfer): void {
  const contractAddress = event.address.toHex()
  const contract = ERC721.bind(event.address)

  let nftContract = NFTContract.load(contractAddress)
  if (nftContract === null) {
    log.debug('Trying to create Contract({})', [event.address.toHexString()])
    nftContract = new NFTContract(contractAddress)
    nftContract.standard = 'ERC721'

    const name = contract.try_name()
    if (name.reverted) {
      log.warning('Query ERC721({})::name() failure', [event.address.toHexString()])
    } else {
      nftContract.name = normalize(name.value)
    }

    const symbol = contract.try_symbol()
    if (symbol.reverted) {
      log.warning('Query ERC721({})::symbol() failure', [event.address.toHexString()])
    } else {
      nftContract.symbol = normalize(symbol.value)
    }

    nftContract.save()
  }

  if (event.params.from !== Address.zero() && event.params.from !== event.address) {
    let account = Account.load(event.params.from.toHex())
    if (account === null) {
      account = new Account(event.params.from.toHex())
      account.sales = 0
      account.purchases = 0
      account.spent = BigInt.fromU32(0)
      account.earned = BigInt.fromU32(0)
      account.save()
    }
  }

  if (event.params.to !== Address.zero() && event.params.to !== event.address) {
    let account = Account.load(event.params.to.toHex())
    if (account === null) {
      account = new Account(event.params.to.toHex())
      account.sales = 0
      account.purchases = 0
      account.spent = BigInt.fromU32(0)
      account.earned = BigInt.fromU32(0)
      account.save()
    }
  }

  const id = `${contractAddress}_${event.params.tokenId}`
  let nft = NFT.load(id)
  if (nft === null) {
    log.debug('Trying to create NFT({})::{}', [event.address.toHex(), event.params.tokenId.toString()])
    nft = new NFT(id)
    nft.contract = nftContract.id
    nft.tokenId = event.params.tokenId
    nft.createdAt = event.block.timestamp

    nft.sales = 0
    nft.totalShares = BigInt.fromI32(0)
    nft.volume = BigInt.fromI32(0)
    nft.searchText = ''

    const uri = contract.try_tokenURI(event.params.tokenId)
    if (uri.reverted) {
      log.warning('Query ERC721({})::tokenURI({}) failure', [
        event.address.toHexString(),
        event.params.tokenId.toString(),
      ])
    } else {
      nft.tokenURI = normalize(uri.value)
    }
  }
  nft.updatedAt = event.block.timestamp
  if (event.params.to === Address.zero() || event.params.to === event.address) {
    // burn
    nft.owner = null
  } else {
    nft.owner = event.params.to.toHex()
  }

  nft.save()
}

export function handleERC1155SingleTransfer(event: TransferSingle): void {}

export function handleERC1155BatchTransfer(event: TransferBatch): void {}
