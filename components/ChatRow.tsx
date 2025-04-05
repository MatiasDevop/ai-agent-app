import { Doc, Id } from "@/convex/_generated/dataModel";
import { TrashIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

function ChatRow({
  chat,
  onDelete,
}: {
  chat: Doc<"chats">;
  onDelete: (chatId: Id<"chats">) => void;
}) {
  const router = useRouter();
  const handleClick = () => {
    router.push(`/dashboard/chat/${chat._id}`);
  };

  //   const handleDelete = () => {
  //     onDelete(chat._id);
  //   };
  //last parte 2:07
  return (
    <div
      className="group rounded-xl border border-gray-200/30 bg-white/50 backdrop-blur-sm hover:bg-white/80
    transition-all duration-200 cursor-pointer
    shadow-sm hover:shadow-md"
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          Chat
          {/* Delete button */}
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 -mr-2 -mt-2 ml-2
            transition-opacity duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(chat._id);
            }}
          >
            <TrashIcon className="w-4 h-4 text-gray-500" />
          </Button>
        </div>
        {/* Last message */}
        {/* {lastMessage && (
            <p className="text-xs text-gray-500 mt-1.2 font-medium">
                <TimeAgo date={lastMessage.createdAt} />
            </p>
            )
        } */}
      </div>
    </div>
  );
}

export default ChatRow;
