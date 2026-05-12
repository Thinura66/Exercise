interface Props {
  name: string
  canTeach: string[]
  wantToLearn: string[]
}

export default function ProfileCard({ name, canTeach, wantToLearn }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md">
      <h1 className="text-2xl font-bold mb-4">{name}</h1>

      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Can Teach
        </h2>
        {canTeach.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {canTeach.map((skill) => (
              <span
                key={skill}
                className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No skills listed yet</p>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Wants to Learn
        </h2>
        {wantToLearn.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {wantToLearn.map((skill) => (
              <span
                key={skill}
                className="bg-emerald-100 text-emerald-800 text-sm px-3 py-1 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No skills listed yet</p>
        )}
      </div>
    </div>
  )
}
