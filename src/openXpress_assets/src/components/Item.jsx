import React, { useEffect, useState } from "react";
import {HttpAgent, Actor} from "@dfinity/agent";
import {idlFactory} from "../../../declarations/nft";
import {idlFactory as tokenIdlFactory} from "../../../declarations/token";
import {Principal} from "@dfinity/principal";
import Button from "./Button";
import {openXpress} from "../../../declarations/openXpress";
import CURRENT_USER_ID from "../index";
import Price from "./PriceLabel";

function Item(props) {
  const [name, setName] = useState();
  const [owner, setOwner] = useState();
  const [image, setImage] = useState();
  const [button, setButton] = useState();
  const [hidden, setHidden] = useState(true);
  const [priceInput, setPriceInput] = useState();
  const [blur, setBlur] = useState();
  const [listed, setListed] = useState("");
  const [priceLabel, setPriceLabel] = useState();
  const [shouldDisplay, setShouldDisplay] = useState(true);


  const id = props.id;
  const localHost = "http://localhost:8080/";
  const agent = new HttpAgent({host: localHost});
  // Remove this next line on live deployment
  agent.fetchRootKey();
  let nftActor;

  async function loadNFT () {
    nftActor = await Actor.createActor(idlFactory, {
      agent, 
      canisterId:id,
    });

    const name = await nftActor.getName();
    const owner = await nftActor.getOwner();
    const imgData = await nftActor.getImage();
    const imageContent = new Uint8Array(imgData);
    // convert the image to url blob
    const image = URL.createObjectURL(new Blob([imageContent.buffer], {type: "image/png"}));

    setName(name);
    setOwner(owner.toString());
    setImage(image);
    if (props.role  == "collection") {

      const nftIsListed = await openXpress.isListed(props.id);
      if (nftIsListed) {
        setOwner("Open-Xpress");
        setBlur({filter: "blur(5px)"});
        setListed("Listed");
      } else {
        setButton(<Button handleClick={handleSell} text={"Sell"}/>);
      }

    } else if (props.role == "discover") {
      const originalOwner = await openXpress.getOriginalOwner(props.id)
      if (originalOwner.toText() != CURRENT_USER_ID.toText()) {
        setButton(<Button handleClick={handleBuy} text={"Buy"}/>);
      }

      const price = await openXpress.getPrice(props.id)
      setPriceLabel(<Price sellPrice={price.toString()}/>);
    }

  }

  useEffect(() => {
    loadNFT();
  }, []);

  let price;

  function handleSell () {
    setPriceInput(<input placeholder="Price in DOVE" type="number" className="price-input" value={price} onChange={(e) => (price=e.target.value)} />)
    setButton(<Button handleClick={sellItem} text="Confirm"/>);
  }

  async function handleBuy() {
    console.log("Buy was triggered");
    setHidden(false)
    const tokenActor = await Actor.createActor(tokenIdlFactory, {
      agent, 
      canisterId: Principal.fromText("wzp7w-lyaaa-aaaaa-aaara-cai"),
    });

    const sellerId = await openXpress.getOriginalOwner(props.id);
    const itemPrice = await openXpress.getPrice(props.id);

    const result = await tokenActor.transfer(sellerId, itemPrice);
    console.log("Transfer " + result);
    if (result == "Success") {
      const transferResult = await openXpress.completePurchase(props.id, sellerId, CURRENT_USER_ID);
      console.log("Purchase " + transferResult)
      setHidden(true);
      setShouldDisplay(false);
    }

  }

  async function sellItem () {
    setBlur({filter: "blur(5px)"});
    setHidden(false)
    const newListing = await openXpress.listItem(props.id, parseInt(price));
    console.log(newListing)
    console.log("Listing Price: " + price)
    if (newListing == "Success") {
      const openXpressId = await openXpress.getOpenCanisterId();
      const transfeResult = await nftActor.transferOwnership(openXpressId);
      console.log("transger" + transfeResult);
      if (transfeResult == "Success") {
        setHidden(true);
        setButton();
        setPriceInput();
        setOwner("Open-Xpress");
        setListed("Listed");
      }
    }

  }

  return (
    <div style={{display: shouldDisplay ? "inline" : "none"}} className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img" src={image} style={blur}/>
        <div className="lds-ellipsis" hidden={hidden}>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
      </div>
        <div className="disCardContent-root">
          {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}: <span className="purple-text">{listed}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner}
          </p>
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
