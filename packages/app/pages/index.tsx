import type { NextPage } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Web3 from "web3";
import { AbiType, StateMutabilityType } from "web3-utils";
import { Modal, Input, Button } from "@cabindao/topo";
import { styled } from "../stitches.config";
import passportFactoryJson from "../../contracts/artifacts/contracts/PassportFactory.sol/PassportFactory.json";

const DRAWER_WIDTH = 255;
const HEADER_HEIGHT = 64;

const TabContainer = styled("div", {
  minHeight: 64,
  padding: 20,
  cursor: "pointer",
});

const Tab: React.FC<{ to: string }> = ({ children, to }) => {
  const router = useRouter();
  const onClick = useCallback(() => router.push(`#${to}`), [router, to]);
  return <TabContainer onClick={onClick}>{children}</TabContainer>;
};

const ModalInput = styled(Input, { paddingLeft: 8, marginBottom: 32 });

const MembershipTabContent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const address = useAddress();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const web3 = useWeb3();
  const contractInstance = useMemo(() => {
    const contract = new web3.eth.Contract(
      passportFactoryJson.abi.map((a) => ({
        ...a,
        stateMutability: a.stateMutability as StateMutabilityType,
        type: a.type as AbiType,
      }))
    );
    contract.options.address = ""; // how to get address based on chainId?
    return contract;
  }, [web3]);
  return (
    <>
      <h1>Memberships</h1>
      <div>
        <Button onClick={open} type="primary" disabled={!address}>
          Create New Membership Type
        </Button>
        <Modal
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          title="New Membership Type"
          onConfirm={() => {
            contractInstance.methods.create
              .send
              // Allocate space for ${quantity} NFTS to be minted/bought at ${price}
              ();
          }}
        >
          <ModalInput
            label={"Name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <ModalInput
            label={"Description"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <ModalInput
            label={"Quantity"}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <ModalInput
            label={"Price"}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Modal>
      </div>
    </>
  );
};

const UsersTabContent = () => {
  return (
    <>
      <h1>Users</h1>
      <div>Coming Soon!</div>
    </>
  );
};

const SettingsTabContent = () => {
  return (
    <>
      <h1>Settings</h1>
      <div>Coming Soon!</div>
    </>
  );
};

const Web3Context = React.createContext({
  address: "",
  web3: { current: undefined } as { current?: Web3 },
});
const useAddress = () => useContext(Web3Context).address;
const useWeb3 = () => useContext(Web3Context).web3.current!;

const Home: NextPage = () => {
  const router = useRouter();
  const tab = useMemo(() => router.asPath.replace(/^\/#?/, ""), [router]);
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState(0);
  const web3 = useRef<Web3>(
    new Web3(Web3.givenProvider || "ws://localhost:8545")
  );
  const getWeb3Info = useCallback(
    () =>
      Promise.all([
        web3.current.eth.getAccounts(),
        web3.current.eth.getChainId(),
      ]).then(([addresses, chain]) => {
        setAddress(addresses[0]);
        setChainId(chain);
      }),
    [setAddress, setChainId]
  );
  const connectWallet = useCallback(() => {
    (web3.current.givenProvider.enable() as Promise<void>).then(getWeb3Info);
  }, [getWeb3Info, web3]);
  useEffect(() => {
    if (web3.current.givenProvider.isConnected()) {
      getWeb3Info();
    }

    web3.current.eth.givenProvider.on(
      "accountsChanged",
      (accounts: string[]) => {
        setAddress(accounts[0]);
      }
    );

    // Subscribe to chainId change
    web3.current.eth.givenProvider.on("chainChanged", (chainId: number) => {
      setChainId(chainId);
    });
  }, [getWeb3Info, web3, setChainId, setAddress]);
  return (
    <div
      style={{
        padding: "0 2rem",
      }}
    >
      <Head>
        <title>NFT Passports</title>
        <meta name="description" content="App | NFT Passports" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header // TODO replace with Topo header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "right",
          padding: 16,
          marginLeft: DRAWER_WIDTH,
          height: HEADER_HEIGHT,
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
        }}
      >
        {address ? (
          <>
            {chainId && (
              <span style={{ marginRight: 16 }}>ChainId: {chainId}</span>
            )}
            <Button>
              {address.slice(0, 6)}...{address.slice(-4)}
            </Button>
          </>
        ) : (
          <Button // TODO replace with TOPO button
            onClick={connectWallet}
          >
            Connect Wallet
          </Button>
        )}
      </header>
      <div
        style={{
          width: DRAWER_WIDTH,
          flex: "0 0 auto",
        }}
      >
        <div
          style={{
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            background: "#fdf3e7",
            height: "100%",
            color: "#324841",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            flex: "1 0 auto",
            zIndex: 1200,
            position: "fixed",
            top: 0,
            outline: 0,
            left: 0,
            borderRight: "#fdf3e7",
          }}
        >
          <div style={{ minHeight: 64, padding: 20 }}>
            <Link href="/">
              <a>NFT Passports Dashboard</a>
            </Link>
          </div>
          <Tab to={"memberships"}>Memberships</Tab>
          <Tab to={"users"}>Users</Tab>
          <Tab to={"settings"}>Settings</Tab>
        </div>
      </div>
      <Web3Context.Provider value={{ address, web3 }}>
        <main
          style={{
            height: `calc(100vh - ${HEADER_HEIGHT}px)`,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            marginLeft: DRAWER_WIDTH,
            width: `calc(100% - 255px)`,
          }}
        >
          {tab === "memberships" && <MembershipTabContent />}
          {tab === "users" && <UsersTabContent />}
          {tab === "settings" && <SettingsTabContent />}
        </main>
      </Web3Context.Provider>
    </div>
  );
};

export default Home;