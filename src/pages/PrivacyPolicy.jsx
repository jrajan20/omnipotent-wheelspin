import { Container, Title, Text, Stack, Anchor, List } from '@mantine/core';

export function PrivacyPolicy() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2} mb={4}>Privacy Policy</Title>
          <Text size="sm" c="dimmed">Effective date: August 2026</Text>
        </div>

        <Stack gap="xs">
          <Title order={4}>What this app does</Title>
          <Text>
            Omnipotent Wheelspin lets you build, spin, and share customisable prize
            wheels. You can save wheels to your account, spin them, and share them
            with others via a public link. An AI-powered chatbot can generate wheel
            options from a text prompt you provide.
          </Text>
        </Stack>

        <Stack gap="xs">
          <Title order={4}>Data we collect</Title>
          <Text>When you create an account we collect:</Text>
          <List size="sm" spacing="xs">
            <List.Item>
              <strong>Email address</strong> — used for authentication and account
              management.
            </List.Item>
            <List.Item>
              <strong>Username</strong> (optional) — a display name you choose at
              sign-up.
            </List.Item>
            <List.Item>
              <strong>Wheels and their content</strong> — titles, option labels, spin
              counts, and share settings for every wheel you save.
            </List.Item>
          </List>
          <Text>We do not collect payment information, precise location data, or any data from users who have not created an account.</Text>
        </Stack>

        <Stack gap="xs">
          <Title order={4}>AI processing</Title>
          <Text>
            The Wheelspin Bot feature sends the chat messages you type to the{' '}
            <strong>Google Gemini API</strong> in order to generate wheel option
            lists. Those prompts are transmitted to and processed on Google&apos;s
            servers. Do not include personal, sensitive, or confidential information
            in chat prompts.
          </Text>
        </Stack>

        <Stack gap="xs">
          <Title order={4}>Third parties we share data with</Title>
          <List size="sm" spacing="xs">
            <List.Item>
              <strong>Supabase</strong> — provides database storage and
              authentication services. Your account details and saved wheels are
              stored on Supabase infrastructure. See{' '}
              <Anchor href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
                Supabase&apos;s Privacy Policy
              </Anchor>.
            </List.Item>
            <List.Item>
              <strong>Google (Gemini API)</strong> — processes chat prompts to
              generate wheel option lists. See{' '}
              <Anchor href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                Google&apos;s Privacy Policy
              </Anchor>.
            </List.Item>
            <List.Item>
              <strong>Vercel</strong> — hosts and serves the web application. See{' '}
              <Anchor href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
                Vercel&apos;s Privacy Policy
              </Anchor>.
            </List.Item>
          </List>
          <Text>We do not sell your personal data to any third party.</Text>
        </Stack>

        <Stack gap="xs">
          <Title order={4}>Data retention and deletion</Title>
          <Text>
            Your account data and saved wheels are retained until you delete them or
            close your account. Deleting a wheel removes it immediately and
            permanently from our database. To request deletion of your account and
            all associated data, contact us using the details below.
          </Text>
        </Stack>

        <Stack gap="xs">
          <Title order={4}>Your rights</Title>
          <Text>
            Depending on your location you may have rights to access, correct, or
            delete personal data we hold about you, or to object to certain
            processing. To exercise any of these rights, please contact us.
          </Text>
        </Stack>

        <Stack gap="xs">
          <Title order={4}>Contact</Title>
          <Text>
            For privacy questions or data requests, open an issue in the project
            repository or contact the app owner directly.
          </Text>
        </Stack>
      </Stack>
    </Container>
  );
}
