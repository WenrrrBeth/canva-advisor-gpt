import { Button, Rows, Text, MultilineInput, Select, TypographyCard, ProgressBar } from "@canva/app-ui-kit";
import { addNativeElement } from "@canva/design";
import styles from "styles/components.css";
import { useSelection } from "utils/use_selection_hook";
import OpenAI from "openai";
import { OPENAI_API } from "./env";
import { useState, useEffect } from "react";



export const App = () => {
  const [loading, setLoading] = useState(-1);
  const [usrInput, setUsrInput] = useState({
    instruction: "",
    length: "medium",
    finalText: "",
  })
  const [gptResponse, setGptResponse] = useState<string[]>([]);
  const currentSelection = useSelection("plaintext");
  const openai = new OpenAI({ apiKey: OPENAI_API, dangerouslyAllowBrowser: true });

  const generateMsg = async () => {
    setLoading(100);
    const draft = await currentSelection.read();
    let usr = `${usrInput.instruction ? `I want to write a section of text, I have the following instructions: ${usrInput.instruction}` : "I want to write a section of text"}` + ", and it is related to following points: "

    for (const content of draft.contents) {
      usr += content.text + ", ";

    }
    usr += `generate me a ${usrInput.length} length text that satisfies what I stated above. (Provide a response without conversational phrases, straightforward manner with no symbols or formatting)`
    setUsrInput((prev) => {
      let newVal = { ...prev };
      newVal.finalText = usr;
      return newVal
    })
  }

  const startChat = async (msg: string) => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      n: 3,
      messages: [
        {
          role: "user", 
          content: msg,
        }
      ],
    });
    let res = [] as string[];
    response.choices.forEach((choice) => {
      if (choice.message.content) res.push(choice.message.content);
    })
    setGptResponse(res);
    setLoading(-1)
  }

  useEffect(() => {
    if (!usrInput.finalText) return;
    startChat(usrInput.finalText)
  }, [usrInput.finalText])

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Text>
          Select in the page where you want this section to be related to, and add text below for additional instructions.
        </Text>
        <MultilineInput
          autoGrow
          placeholder="Enter additional instructions"
          onChange={(value) => setUsrInput((prev) => {
            let newVal = { ...prev };
            newVal.instruction = value;
            return newVal;
          })}
          disabled={loading !== -1}
        />
        <Select
          stretch
          placeholder="Select text length"
          disabled={loading !== -1}
          options={[
            {
              label: 'Short',
              value: 'short'
            },
            {
              label: 'Medium',
              value: 'medium'
            },
            {
              label: 'Long',
              value: 'long'
            },
          ]}
          onChange={(value) => setUsrInput((prev) => {
            let newVal = { ...prev };
            newVal.length = value;
            return newVal;
          })}
          
        />
        <Button disabled={loading !== -1} variant="primary" onClick={generateMsg} stretch>
          Generate section
        </Button>
        {
          loading !== -1 &&
            <ProgressBar
              size="medium"
              tone="info"
              value={loading}
            />
        }
        {
          gptResponse.map((gptRes) => (
            <Rows spacing="1u">
              <TypographyCard
                ariaLabel="Add copy to design"
                onClick={ async () => {
                  await addNativeElement({
                    type: "TEXT",
                    children: [gptRes],
                    fontSize: 30,
                  });
                }}
                onDragStart={() => {}}
              >
                <Text>
                  {gptRes}
                </Text>
              </TypographyCard>
            </Rows>
          ))
        }
      </Rows>
    </div>
  );
};
