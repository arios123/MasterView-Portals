import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { QUESTION_FIELDS, LookbookAnswers } from '@/types/lookbook';

interface QuestionFormFieldsProps {
  answers: LookbookAnswers;
  onAnswerChange: (fieldId: string, value: string) => void;
  readOnly?: boolean;
}

export function QuestionFormFields({ answers, onAnswerChange, readOnly }: QuestionFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {QUESTION_FIELDS.map((q) => (
        <div key={q.id} className="space-y-1.5">
          <Label htmlFor={q.id} className="text-sm font-medium">
            {q.label}
          </Label>
          {q.long ? (
            <Textarea
              id={q.id}
              value={answers[q.id] || ''}
              onChange={(e) => onAnswerChange(q.id, e.target.value)}
              className="mt-1"
              disabled={readOnly}
            />
          ) : (
            <Input
              id={q.id}
              value={answers[q.id] || ''}
              onChange={(e) => onAnswerChange(q.id, e.target.value)}
              className="mt-1"
              disabled={readOnly}
            />
          )}
        </div>
      ))}
    </div>
  );
}

