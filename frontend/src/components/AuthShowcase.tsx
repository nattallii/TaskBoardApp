import { Badge, Box, Heading, HStack, Stack, Text, VStack } from '@chakra-ui/react'

const PREVIEW_COLUMNS = [
  {
    title: 'Ideas',
    accent: '#805AD5',
    tag: 'Discovery',
    tasks: [
      { title: 'Зібрати фічі для релізу', note: 'Бриф від маркетингу' },
      { title: 'Оцінити складність', note: 'PM + Engineering draft' },
    ],
  },
  {
    title: 'In Progress',
    accent: '#3182CE',
    tag: 'Delivery',
    tasks: [
      { title: 'Дизайн екрану онбордингу', note: 'FIG-204' },
      { title: 'API для push-сповіщень', note: 'BE-118' },
    ],
  },
  {
    title: 'Review',
    accent: '#38A169',
    tag: 'QA',
    tasks: [
      { title: 'Регресійний прогін', note: 'QA чек-лист' },
      { title: 'Фінальне демо', note: 'Команда <> Stakeholders' },
    ],
  },
]

export function AuthShowcase() {
  return (
    <VStack align="stretch" gap={8} color="colors.text.base">
      <VStack align="flex-start" gap={3}>
        <Text textTransform="uppercase" letterSpacing="0.3em" fontSize="xs" color="colors.text.subtle">
          TaskBoard workspace
        </Text>
        <Heading size="2xl" lineHeight="1.1">
          Плануйте спринти та оживляйте дошку з першої сесії
        </Heading>
      </VStack>

      <Box>
        <Text fontWeight="600" mb={1}>
          Превʼю дошки (initial fetch)
        </Text>
        <Text fontSize="sm" color="colors.text.subtle" mb={4}>
          Живі колонки з прикладами задач допомагають команді одразу орієнтуватися в борді.
        </Text>
        <HStack gap={4} align="stretch" overflowX="auto" pb={2}>
          {PREVIEW_COLUMNS.map((column) => (
            <VStack
              key={column.title}
              bg="white"
              borderRadius="xl"
              border="1px solid"
              borderColor="gray.100"
              boxShadow="0 12px 30px rgba(15, 23, 42, 0.08)"
              p={4}
              align="stretch"
              minW="240px"
              gap={3}
            >
              <HStack justify="space-between">
                <Text fontWeight="semibold">{column.title}</Text>
                <Badge colorScheme="gray" borderRadius="full">
                  {column.tag}
                </Badge>
              </HStack>
              <Box h="3px" borderRadius="full" bg={column.accent} opacity={0.5} />
              <Stack gap={3}>
                {column.tasks.map((task) => (
                  <Box
                    key={task.title}
                    border="1px solid"
                    borderColor="gray.100"
                    borderRadius="lg"
                    p={3}
                    bg="gray.25"
                  >
                    <Text fontWeight="medium" fontSize="sm">
                      {task.title}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {task.note}
                    </Text>
                  </Box>
                ))}
              </Stack>
            </VStack>
          ))}
        </HStack>
      </Box>
    </VStack>
  )
}
