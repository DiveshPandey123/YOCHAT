
// Login.js
import { useState, useContext } from "react";
import {
  Flex, Heading, Input, Button, InputGroup, Stack, InputLeftElement,
  chakra, Box, Link, Avatar, FormControl, FormHelperText, InputRightElement,
  Card, CardBody, useToast, Spinner, Tooltip,
} from "@chakra-ui/react";
import { FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import chatContext from "../../context/chatContext";
import { ArrowBackIcon } from "@chakra-ui/icons";

const CFaLock = chakra(FaLock);

const Login = (props) => {
  const context = useContext(chatContext);
  // CHANGED: ensure fetchData is taken from context, but also guard against undefined
  const { hostName, socket, setUser, setIsAuthenticated, fetchData } = context; // CHANGED

  const toast = useToast();
  const navigator = useNavigate();

  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const handletabs = props.handleTabsChange;
  const [showPassword, setShowPassword] = useState(false);
  const [forgotpasswordshow, setforgotpasswordshow] = useState(false);
  const [sending, setSending] = useState(false); // CHANGED
  const [otp, setOtp] = useState(""); // CHANGED

  function showtoast(title, description, status) {
    toast({ title, description, status, duration: 4000, isClosable: true });
  }

  const handleShowClick = () => setShowPassword(!showPassword);

  // CHANGED: unified login handler with credentials + error guards
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return showtoast("An error occurred.", "Email required", "error");

    const payload = { email };
    if (forgotpasswordshow) {
      if (!otp) return showtoast("An error occurred.", "OTP required", "error");
      payload.otp = otp;
    } else {
      if (!password) return showtoast("An error occurred.", "Password required", "error");
      payload.password = password;
    }

    try {
      setSending(true); // CHANGED
      const response = await fetch(`${hostName}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // CHANGED: CORS cookies/headers
        body: JSON.stringify(payload),
      });

      let data = {};
      try { data = await response.json(); } catch { /* CHANGED: tolerate non-JSON */ }

      if (!response.ok) {
        return showtoast("An error occurred.", data?.error || "Login failed", "error");
      }

      localStorage.setItem("token", data.authtoken);
      localStorage.setItem("user", JSON.stringify(data.user)); // CHANGED
      setUser(data.user);
      setIsAuthenticated(true);

      if (socket && !socket.connected) socket.connect(); // CHANGED
      socket?.emit("setup", data.user._id); // CHANGED

      if (typeof fetchData === "function") {
        await fetchData(); // CHANGED: prevents “fetchData is not a function”
      }

      showtoast("Success", "Login successful", "success");
      navigator("/dashboard");
    } catch (err) {
      console.error("login error:", err); // CHANGED
      showtoast("Network error", "Failed to connect to server", "error");
    } finally {
      setSending(false); // CHANGED
    }
  };

  return (
    <Flex align="center" justify="center" minH="100vh">
      <Card w="420px">
        <CardBody>
          <Heading mb={6}>Login</Heading>
          <form onSubmit={handleLogin}>
            <Stack spacing={4}>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setemail(e.target.value)}
                  required
                />
              </FormControl>

              {!forgotpasswordshow && (
                <FormControl>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none" children={<CFaLock color="gray.300" />} />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setpassword(e.target.value)}
                      required
                    />
                    <InputRightElement width="4.5rem">
                      <Button h="1.75rem" size="sm" onClick={handleShowClick}>
                        {showPassword ? "Hide" : "Show"}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
              )}

              {forgotpasswordshow && (
                <FormControl>
                  <Input
                    id="otp"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <FormHelperText>Check email for OTP</FormHelperText>
                </FormControl>
              )}

              <Button type="submit" colorScheme="purple" isLoading={sending}>
                Login
              </Button>

              <Button variant="ghost" onClick={() => handletabs?.(1)}>
                Create account
              </Button>
            </Stack>
          </form>
        </CardBody>
      </Card>
    </Flex>
  );
};

export default Login;
