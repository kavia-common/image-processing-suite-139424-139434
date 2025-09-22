import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders topbar brand", () => {
  render(<App />);
  const brand = screen.getByText(/Image Processing Suite/i);
  expect(brand).toBeInTheDocument();
});
