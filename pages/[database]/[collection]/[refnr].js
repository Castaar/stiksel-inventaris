import { productRedirect } from "../../../lib/legacy-urls";

export default function ProductRedirect() {
  return null;
}

export const getServerSideProps = productRedirect;
