import Debug "mo:base/Debug";
import Principal "mo:base/Principal";

actor class NFT (name: Text, owner: Principal, content: [Nat8]) = this {
    private let nftName = name;
    private var nftOwner = owner;
    private let nftImageBytes = content;

    public query func getName () : async Text {
        return nftName;
    };

    public query func getOwner () : async Principal {
        return nftOwner;
    };

    public query func getImage () : async [Nat8] {
        return nftImageBytes;
    };

    public query func getCanisterID () : async Principal{
        return Principal.fromActor(this);
    };

    public shared(msg) func transferOwnership(newOwner: Principal) : async Text {
        if (msg.caller == nftOwner) {
            nftOwner := newOwner;
            return "Success";
        } else {
            return "Error: Not initiated by the nft owner";
        };
    };

}