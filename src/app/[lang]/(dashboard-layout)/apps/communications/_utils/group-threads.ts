import type {
  A2AEnterpriseMessage,
  A2AMessageType,
  A2APriority,
  MonitoringThread,
  ThreadParticipant,
} from "../types"

const PRIORITY_ORDER: Record<A2APriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  urgent: 3,
}

/**
 * Groups a flat array of enterprise messages into MonitoringThread objects.
 *
 * Strategy:
 * 1. Messages with reply_to_id → linked to parent's thread
 * 2. Remaining messages → grouped by (sorted agent pair + subject)
 * 3. Each standalone message → its own single-message thread
 */
export function groupMessagesIntoThreads(
  messages: A2AEnterpriseMessage[]
): MonitoringThread[] {
  const messageMap = new Map<string, A2AEnterpriseMessage>()
  for (const msg of messages) {
    messageMap.set(msg.id, msg)
  }

  // Find thread root for each message by walking reply_to_id chains
  const threadRoots = new Map<string, string>() // messageId -> rootId

  function findRoot(msgId: string, visited = new Set<string>()): string {
    if (visited.has(msgId)) return msgId
    visited.add(msgId)

    const msg = messageMap.get(msgId)
    if (!msg?.reply_to_id || !messageMap.has(msg.reply_to_id)) {
      return msgId
    }
    const root = findRoot(msg.reply_to_id, visited)
    threadRoots.set(msgId, root)
    return root
  }

  // Group messages by thread key
  const threadGroups = new Map<string, A2AEnterpriseMessage[]>()

  for (const msg of messages) {
    let threadKey: string

    if (msg.reply_to_id && messageMap.has(msg.reply_to_id)) {
      // Has a reply chain → use root message ID as thread key
      threadKey = `reply:${findRoot(msg.id)}`
    } else {
      // No reply chain → group by agent pair + subject
      const agents = [msg.from_agent_id, msg.to_agent_id || ""].sort()
      const subject = (msg.subject ?? "").trim().toLowerCase()
      threadKey = `pair:${agents[0]}:${agents[1]}:${subject}`
    }

    if (!threadGroups.has(threadKey)) {
      threadGroups.set(threadKey, [])
    }
    threadGroups.get(threadKey)!.push(msg)
  }

  // Build MonitoringThread objects
  const threads: MonitoringThread[] = []

  for (const [key, msgs] of threadGroups) {
    // Skip empty groups
    if (msgs.length === 0) continue

    // Sort by created_at ascending
    msgs.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    const latest = msgs[msgs.length - 1]!
    const first = msgs[0]!

    // Collect unique participants
    const participantMap = new Map<string, ThreadParticipant>()
    for (const msg of msgs) {
      if (msg.from_agent_id && !participantMap.has(msg.from_agent_id)) {
        participantMap.set(msg.from_agent_id, {
          agentId: msg.from_agent_id,
          agentName: msg.from_agent_name ?? msg.from_agent_id,
          departmentId: msg.from_department_id ?? null,
          departmentName: msg.from_department_name ?? null,
        })
      }
      if (msg.to_agent_id && !participantMap.has(msg.to_agent_id)) {
        participantMap.set(msg.to_agent_id, {
          agentId: msg.to_agent_id,
          agentName: msg.to_agent_name ?? msg.to_agent_id,
          departmentId: msg.to_department_id,
          departmentName: msg.to_department_name ?? null,
        })
      }
    }

    // Collect unique message types
    const typeSet = new Set<A2AMessageType>()
    for (const msg of msgs) {
      typeSet.add(msg.message_type)
    }

    // Find highest priority
    let highestPriority: A2APriority = "low"
    for (const msg of msgs) {
      if (PRIORITY_ORDER[msg.priority] > PRIORITY_ORDER[highestPriority]) {
        highestPriority = msg.priority
      }
    }

    // Find task_id and conversation_id (first non-null)
    const taskId = msgs.find((m) => m.task_id)?.task_id ?? null
    const conversationId =
      msgs.find((m) => m.conversation_id)?.conversation_id ?? null

    // Subject: use first message's subject, or first body snippet
    const subject = first.subject ?? first.body.slice(0, 80) ?? "No subject"

    // Department pair from first message
    const departmentPair = {
      from:
        first.from_department_id && first.from_department_name
          ? { id: first.from_department_id, name: first.from_department_name }
          : null,
      to:
        first.to_department_id && first.to_department_name
          ? { id: first.to_department_id, name: first.to_department_name }
          : null,
    }

    threads.push({
      id: key,
      subject,
      messages: msgs,
      participants: Array.from(participantMap.values()),
      latestMessage: latest,
      messageTypes: Array.from(typeSet),
      highestPriority,
      taskId,
      conversationId,
      departmentPair,
      messageCount: msgs.length,
      lastActivity: latest.created_at,
    })
  }

  // Sort by last activity descending
  threads.sort(
    (a, b) =>
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  )

  return threads
}
