// Signup.js
import chatContext from "../../context/chatContext";
import { useState, useContext } from "react";
import {
  Flex, Heading, Input, Button, InputGroup, Stack, InputLeftElement,
  Box, Link, Avatar, FormControl, InputRightElement, Card, CardBody, useToast,
} from "@chakra-ui/react";
import { LockIcon } from "@chakra-ui/icons";

const Signup = (props) => {
  const context = useContext(chatContext);
  const { hostName } = context; // keep
  const toast = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [name, setname] = useState("");
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");
  const [confirmpassword, setconfirmpassword] = useState("");
  const handletabs = props.handleTabsChange;

  function showtoast(title, description, status) { // CHANGED: normalized helper
    toast({ title, description, status, duration: 4000, isClosable: true }); // CHANGED
  }

  const handleShowClick = () => setShowPassword(!showPassword);

  // CHANGED: robust signup
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return showtoast("An error occurred.", "All fields are required", "error");
    }
    if (password !== confirmpassword) {
      return showtoast("An error occurred.", "Passwords do not match", "error");
    }

    try {
      const response = await fetch(`${hostName}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // CHANGED
        body: JSON.stringify({ name, email, password }),
      });

      let data = {};
      try { data = await response.json(); } catch {}

      if (!response.ok) {
        return showtoast("An error occurred.", data?.error || "Signup failed", "error");
      }

      localStorage.setItem("token", data.authtoken); // CHANGED
      localStorage.setItem("user", JSON.stringify(data.user)); // CHANGED
      showtoast("Success", "Account created", "success");
      handletabs?.(0); // CHANGED: go to login tab
    } catch (err) {
      console.error("signup error:", err); // CHANGED
      showtoast("Network error", "Failed to connect to server", "error");
    }
  };

  return (
    <Flex align="center" justify="center" minH="100vh">
      <Card w="460px">
        <CardBody>
          <Heading mb={6}>Sign up</Heading>
          <form onSubmit={handleSignup}>
            <Stack spacing={4}>
              <FormControl>
                <Input placeholder="Name" value={name} onChange={(e) => setname(e.target.value)} required />
              </FormControl>
              <FormControl>
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setemail(e.target.value)} required />
              </FormControl>
              <FormControl>
                <InputGroup>
                  <InputLeftElement pointerEvents="none" children={<LockIcon color="gray.300" />} />
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
              <FormControl>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmpassword}
                  onChange={(e) => setconfirmpassword(e.target.value)}
                  required
                />
              </FormControl>
              <Button type="submit" colorScheme="purple">Create account</Button>
              <Button variant="ghost" onClick={() => handletabs?.(0)}>Back to login</Button>
            </Stack>
          </form>
        </CardBody>
      </Card>
    </Flex>
  );
};

export default Signup;
