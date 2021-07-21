import { TokenMinted } from '../../generated/ERC721Squad/ERC721Squad'
import { SquadNFT } from '../../generated/schema'
import { log } from '@graphprotocol/graph-ts'

export function handleTokenMinted(event: TokenMinted): void {
  let nft = new SquadNFT(event.params.tokenId.toString())
  nft.creator = event.params.creator
  nft.contentURI = event.params.contentURI
  nft.metadataURI = event.params.metadataURI
  nft.blockCreated = event.block.number
  nft.save()
}