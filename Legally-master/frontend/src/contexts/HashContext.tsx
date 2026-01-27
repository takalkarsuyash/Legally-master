import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface HashType {
  hashId: string;
}

interface HashContextType {
  hashData: HashType;
  setHashData: (data: HashType) => void;
}

export const HashContext = createContext<HashContextType>({
  hashData: { hashId: "" },
  setHashData: () => {},
});

export const HashProvider = ({ children }: { children: ReactNode }) => {
  const [hashData, setHashData] = useState<HashType>({ hashId: "" });
  console.log("Hash Data in Provider: ", hashData);
  const setHashDataCallback = useCallback((data: HashType) => {
    setHashData(data);
  }, []);
  return (
    <HashContext.Provider
      value={{ hashData, setHashData: setHashDataCallback }}
    >
      {children}
    </HashContext.Provider>
  );
};
export const useHash = () => {
  const context = useContext(HashContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
