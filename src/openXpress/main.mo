import Principal "mo:base/Principal";
import NFTActorClass "../NFT/nft";
import Debug "mo:base/Debug";
import Cycles "mo:base/ExperimentalCycles";
import HashMap "mo:base/HashMap";
import List "mo:base/List";
import Iter "mo:base/Iter";


actor OpenXpress{

    private type Listing = {
        itemOwner: Principal;
        itemPrice: Nat;
    };

    var mapOfNfts = HashMap.HashMap<Principal, NFTActorClass.NFT>(1, Principal.equal, Principal.hash);
    var mapOfOwners = HashMap.HashMap<Principal, List.List<Principal>>(1, Principal.equal, Principal.hash);
    var mapOfListings = HashMap.HashMap<Principal, Listing>(1, Principal.equal, Principal.hash);

    public shared(msg) func mint(imgData: [Nat8], name: Text) : async Principal {
        let owner : Principal = msg.caller;

        Debug.print(debug_show(Cycles.balance()));
        Cycles.add(100_500_000_000);
        let newNFT = await NFTActorClass.NFT(name, owner, imgData);
        Debug.print(debug_show(Cycles.balance()));

        let newNFTPrinicpalId = await newNFT.getCanisterID();
        mapOfNfts.put(newNFTPrinicpalId, newNFT);

        addToOwnerships(owner, newNFTPrinicpalId);

        return newNFTPrinicpalId;
    };

    private func addToOwnerships(owner: Principal, nftId: Principal) {
        var ownedNfts : List.List<Principal> = switch (mapOfOwners.get(owner)) {
            case null List.nil<Principal>();
            case (?result) result;
        };

        ownedNfts := List.push(nftId, ownedNfts);
        mapOfOwners.put(owner, ownedNfts);
    };

    public query func getOwnedNfts (user: Principal) : async [Principal] {
        var userNfts: List.List<Principal> = switch (mapOfOwners.get(user)) {
            case null List.nil<Principal>();
            case (?result) result;
        };
        return List.toArray(userNfts);
    };

    public query func getListedNfts () : async [Principal] {
        let listedNfts = Iter.toArray(mapOfListings.keys());
        return listedNfts;
    };

    public shared(msg) func listItem(id: Principal, price: Nat): async Text{
        var item: NFTActorClass.NFT = switch (mapOfNfts.get(id)) {
            case null return "Nft does not exist";
            case (?result) result;
        };

        let owner = await item.getOwner();

        if (Principal.equal(owner, msg.caller)) {
            let newListing : Listing = {
                itemOwner = owner; 
                itemPrice = price;
            };
            mapOfListings.put(id, newListing);
            return "Success";
        } else {
            return "you don't own this nft";
        };
    };


    public query func getOpenCanisterId (): async Principal {
        return Principal.fromActor(OpenXpress);
    };


    public query func isListed (id: Principal): async Bool {
        if (mapOfListings.get(id) == null) {
            return false;
        } else {
            return true;
        };
    };

    public query func getOriginalOwner (id: Principal) : async Principal{
        var listing : Listing = switch (mapOfListings.get(id)) {
            case null return Principal.fromText("");
            case (?result) result;
        };
        return listing.itemOwner;
    };

    public query func getPrice (id: Principal) : async Nat{
        var listing : Listing = switch (mapOfListings.get(id)) {
            case null return 0;
            case (?result) result;
        };

        return listing.itemPrice;
    
    };

    public shared(msg) func completePurchase (nftId: Principal, sellerId: Principal, buyerId: Principal) : async Text {
        var purchasedNft : NFTActorClass.NFT = switch (mapOfNfts.get(nftId)) {
            case null return "Nft does not exist";
            case (?result) result;
        };

        let transferResult = await purchasedNft.transferOwnership(buyerId);
        if (transferResult == "Success"){
            mapOfListings.delete(nftId);   
            var ownedNFTs : List.List<Principal> = switch (mapOfOwners.get(sellerId)) {
                case null List.nil<Principal>();
                case (?result) result;
            };
            ownedNFTs := List.filter(ownedNFTs, func (listItemId: Principal) : Bool {
                return listItemId != nftId;
            });
            addToOwnerships(buyerId, nftId);

            return "success";
        } else {
            return "Error";
        };
    };    

};

