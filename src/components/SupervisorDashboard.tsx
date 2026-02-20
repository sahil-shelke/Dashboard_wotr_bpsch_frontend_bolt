import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { VillageApprovalCard } from './VillageApprovalCard';
import { AddSurveyorPage } from './AddSurveyorPage';
import {
  Droplets,
  LogOut,
  MapPin,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  LayoutDashboard,
  UserPlus,
  Loader2,
  ArrowLeft,
  FileText,
  Edit3,
  Save,
  X,
} from 'lucide-react';

interface UnapprovedVillage {
  village_profile_id: number;
  village_name: string;
  block_name: string;
  district_name: string;
  state_name: string;
  full_name: string;
  email: string;
  created_at: string;
  language_id: number;
}

interface Answer {
  answer_id: number;
  answer_text: string;
  score: number;
  recommendation: string;
  is_selected: boolean | null;
}

interface VillageDetail {
  module_id: number;
  module_name: string;
  question_id: number;
  question_text: string;
  answers: string;
  other_answer: string | null;
}

interface EditedResponse {
  question_id: number;
  answer_id: number | null;
  other_answer: string;
}

export const SupervisorDashboard = () => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'approvals', label: 'Approval Requests', icon: ClipboardCheck },
    { id: 'add-surveyor', label: 'Add Surveyors', icon: UserPlus },
  ];

  const stats = [
    { label: 'Assigned Villages', value: '8', icon: MapPin, color: 'blue' },
    { label: 'Pending Assessments', value: '3', icon: ClipboardCheck, color: 'amber' },
    { label: 'Avg. Score', value: '82.3', icon: TrendingUp, color: 'green' },
    { label: 'Urgent Actions', value: '2', icon: AlertTriangle, color: 'red' },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView stats={stats} />;
      case 'approvals':
        return <ApprovalRequestsView />;
      case 'add-surveyor':
        return <AddSurveyorPage />;
      default:
        return <DashboardView stats={stats} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        items={navItems}
        activeItem={activeView}
        onItemClick={setActiveView}
        logo={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">WGS</h1>
              <p className="text-xs text-gray-600">Supervisor</p>
            </div>
          </div>
        }
      />

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {navItems.find((item) => item.id === activeView)?.label}
                </h1>
                <p className="text-xs text-gray-600">Supervisor Portal</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.full_name}
                  </p>
                  <p className="text-xs text-gray-600">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 lg:px-8 py-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

const DashboardView = ({ stats }: { stats: any[] }) => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Overview</h2>
        <p className="text-gray-600">
          Manage and assess water governance in your assigned villages
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            amber: 'bg-amber-100 text-amber-600',
            red: 'bg-red-100 text-red-600',
          };

          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    colorClasses[stat.color as keyof typeof colorClasses]
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Assigned Villages
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Greenfield Village', score: 85, status: 'excellent' },
            { name: 'Riverside Community', score: 78, status: 'good' },
            { name: 'Hillside Township', score: 92, status: 'excellent' },
            { name: 'Valley Springs', score: 68, status: 'needs-improvement' },
            { name: 'Lakeside Haven', score: 81, status: 'good' },
            { name: 'Mountain View', score: 88, status: 'excellent' },
            { name: 'Sunset Valley', score: 73, status: 'good' },
            { name: 'Creek Side', score: 65, status: 'needs-improvement' },
          ].map((village, index) => {
            const statusConfig = {
              excellent: { color: 'green', label: 'Excellent' },
              good: { color: 'blue', label: 'Good' },
              'needs-improvement': { color: 'amber', label: 'Needs Attention' },
            };

            const status =
              statusConfig[village.status as keyof typeof statusConfig];

            return (
              <div
                key={index}
                className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">
                      {village.name}
                    </h4>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full bg-${status.color}-100 text-${status.color}-700`}
                  >
                    {status.label}
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {village.score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pending Assessments
        </h3>
        <div className="space-y-3">
          {[
            {
              village: 'Valley Springs',
              task: 'Quarterly Water Quality Assessment',
              deadline: 'Due in 3 days',
              priority: 'high',
            },
            {
              village: 'Creek Side',
              task: 'Infrastructure Inspection',
              deadline: 'Due in 5 days',
              priority: 'high',
            },
            {
              village: 'Riverside Community',
              task: 'Community Water Usage Report',
              deadline: 'Due in 1 week',
              priority: 'medium',
            },
          ].map((task, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900">{task.village}</p>
                <p className="text-sm text-gray-600">{task.task}</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    task.priority === 'high'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {task.priority === 'high' ? 'Urgent' : 'Upcoming'}
                </span>
                <p className="text-xs text-gray-500 mt-1">{task.deadline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const VillageDetailsView = ({
  village,
  details,
  isLoading,
  onClose,
  groupByModule,
}: {
  village: UnapprovedVillage;
  details: VillageDetail[];
  isLoading: boolean;
  onClose: () => void;
  groupByModule: (details: VillageDetail[]) => { [key: string]: VillageDetail[] };
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedResponses, setEditedResponses] = useState<{
    [key: number]: EditedResponse;
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const groupedDetails = groupByModule(details);

  const handleAnswerSelect = (questionId: number, answerId: number) => {
    if (!isEditMode) return;

    setEditedResponses((prev) => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        answer_id: answerId,
        other_answer: prev[questionId]?.other_answer || '',
      },
    }));
  };

  const handleOtherAnswerChange = (questionId: number, value: string) => {
    if (!isEditMode) return;

    setEditedResponses((prev) => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        answer_id: prev[questionId]?.answer_id || null,
        other_answer: value,
      },
    }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const responses = Object.values(editedResponses);

      for (const response of responses) {
        const payload = {
          id: 0,
          user_id: 0,
          module_id: 0,
          question_id: response.question_id,
          answer_id: response.answer_id || 0,
          village_profile_id: village.village_profile_id,
          other_answer: response.other_answer,
          response_time: new Date().toISOString(),
        };

        const apiResponse = await fetch(
          'http://localhost:8000/api/response/edit/response',
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );

        if (!apiResponse.ok) {
          throw new Error('Failed to save changes');
        }
      }

      setSaveMessage({ type: 'success', text: 'Changes saved successfully!' });
      setIsEditMode(false);
      setEditedResponses({});

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving changes:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to save changes. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedResponses({});
    setSaveMessage(null);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    setSaveMessage(null);

    try {
      const apiUrl = `http://localhost:8000/api/response/approve/village_profile/${village.village_profile_id}`;

      const token = localStorage.getItem('auth_token');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to approve submission: ${response.status} ${errorText}`
        );
      }

      const result = await response.json();
      setSaveMessage({
        type: 'success',
        text: 'Village profile approved successfully!',
      });

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error approving submission:', error);
      setSaveMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to approve submission. Please try again.',
      });
    } finally {
      setIsApproving(false);
    }
  };

  const getSelectedAnswerId = (
    questionId: number,
    parsedAnswers: Answer[]
  ) => {
    if (editedResponses[questionId]?.answer_id !== undefined) {
      return editedResponses[questionId].answer_id;
    }
    const selected = parsedAnswers.find((a) => a.is_selected === true);
    return selected?.answer_id || null;
  };

  const getOtherAnswer = (questionId: number, originalAnswer: string | null) => {
    if (editedResponses[questionId]?.other_answer !== undefined) {
      return editedResponses[questionId].other_answer;
    }
    return originalAnswer || '';
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Approval Requests
        </button>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {village.village_name}
              </h2>
              <p className="text-gray-600">
                {village.block_name}, {village.district_name},{' '}
                {village.state_name}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Submitted by:{' '}
                  <span className="font-medium text-gray-900">
                    {village.full_name}
                  </span>
                </p>
                <p className="text-sm text-gray-500">{village.email}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {!isEditMode ? (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Responses
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
          {saveMessage && (
            <div
              className={`mt-4 p-3 rounded-lg ${
                saveMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {saveMessage.text}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading village details...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {isEditMode && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <Edit3 className="w-5 h-5 text-blue-700" />
                <div>
                  <h3 className="font-semibold text-blue-900">
                    Edit Mode Active
                  </h3>
                  <p className="text-sm text-blue-700">
                    Click on any answer to select it. Edit the additional
                    response text below each question.
                  </p>
                </div>
              </div>
            </div>
          )}

          {Object.entries(groupedDetails).map(([moduleKey, questions]) => {
            const moduleName = questions[0]?.module_name;
            return (
              <div
                key={moduleKey}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              >
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    {moduleName}
                  </h3>
                </div>

                <div className="space-y-6">
                  {questions.map((question, index) => {
                    let parsedAnswers: Answer[] = [];
                    try {
                      parsedAnswers = JSON.parse(question.answers);
                    } catch (e) {
                      console.error('Error parsing answers:', e);
                    }

                    const currentSelectedId = getSelectedAnswerId(
                      question.question_id,
                      parsedAnswers
                    );
                    const currentOtherAnswer = getOtherAnswer(
                      question.question_id,
                      question.other_answer
                    );
                    const hasTextAnswer =
                      currentOtherAnswer !== null && currentOtherAnswer !== '';
                    const selectedAnswers = parsedAnswers.filter(
                      (a) => a.answer_id === currentSelectedId
                    );

                    return (
                      <div
                        key={question.question_id}
                        className="pb-6 border-b border-gray-100 last:border-b-0 last:pb-0"
                      >
                        <div className="mb-4">
                          <div className="flex items-start gap-3">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex-shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <p className="text-gray-900 font-medium leading-relaxed">
                              {question.question_text}
                            </p>
                            {isEditMode && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                Click to select
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="ml-10 space-y-3">
                          {parsedAnswers.map((answer) => {
                            const isSelected =
                              answer.answer_id === currentSelectedId;
                            return (
                              <div
                                key={answer.answer_id}
                                onClick={() =>
                                  handleAnswerSelect(
                                    question.question_id,
                                    answer.answer_id
                                  )
                                }
                                className={`flex items-start gap-3 p-4 rounded-lg transition-all ${
                                  isSelected
                                    ? 'bg-green-50 border-2 border-green-300 shadow-sm'
                                    : 'bg-gray-50 border border-gray-200 opacity-60'
                                } ${
                                  isEditMode
                                    ? 'cursor-pointer hover:border-blue-400 hover:opacity-100'
                                    : ''
                                }`}
                              >
                                <div className="flex items-center h-6">
                                  {isSelected ? (
                                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 fill-green-100" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0"></div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p
                                    className={`text-sm ${
                                      isSelected
                                        ? 'text-gray-900 font-semibold'
                                        : 'text-gray-600'
                                    }`}
                                  >
                                    {answer.answer_text}
                                  </p>
                                  {isSelected &&
                                    answer.recommendation &&
                                    answer.recommendation !== 'None' && (
                                      <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                                        <p className="text-xs font-medium text-gray-700 mb-1">
                                          Recommendation:
                                        </p>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                          {answer.recommendation}
                                        </p>
                                      </div>
                                    )}
                                </div>
                                {isSelected && (
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold text-green-700 bg-green-100 border border-green-300">
                                      Score: {answer.score}
                                    </span>
                                    <span className="text-xs font-medium text-green-600">
                                      SELECTED
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          <div className="mt-4">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Additional Response:
                            </label>
                            {isEditMode ? (
                              <textarea
                                value={currentOtherAnswer}
                                onChange={(e) =>
                                  handleOtherAnswerChange(
                                    question.question_id,
                                    e.target.value
                                  )
                                }
                                rows={3}
                                className="w-full p-4 bg-white border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="Enter additional response..."
                              />
                            ) : hasTextAnswer ? (
                              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                  {currentOtherAnswer}
                                </p>
                              </div>
                            ) : (
                              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-500 italic">
                                  No additional response provided
                                </p>
                              </div>
                            )}
                          </div>

                          {selectedAnswers.length === 0 &&
                            !hasTextAnswer &&
                            !isEditMode && (
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-800">
                                  No answer selected
                                </p>
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {!isEditMode && (
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-emerald-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Approving...
                  </>
                ) : (
                  'Approve Submission'
                )}
              </button>
              <button
                type="button"
                disabled={isApproving}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Submission
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ApprovalRequestsView = () => {
  const [villages, setVillages] = useState<UnapprovedVillage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<UnapprovedVillage | null>(null);
  const [villageDetails, setVillageDetails] = useState<VillageDetail[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchUnapprovedVillages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        'http://localhost:8000/api/response/unapproved_villages'
      );

      if (!response.ok) {
        throw new Error('Failed to fetch unapproved villages');
      }

      const data = await response.json();

      const uniqueVillages = data.filter(
        (
          village: UnapprovedVillage,
          index: number,
          self: UnapprovedVillage[]
        ) =>
          index ===
          self.findIndex(
            (v) => v.village_profile_id === village.village_profile_id
          )
      );

      setVillages(uniqueVillages);
    } catch (err) {
      setError('Failed to load approval requests. Please try again.');
      console.error('Error fetching unapproved villages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnapprovedVillages();
  }, []);

  const handleViewDetails = async (village: UnapprovedVillage) => {
    setSelectedVillage(village);
    setIsLoadingDetails(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/response/village/${village.village_profile_id}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch village details');
      }

      const data = await response.json();
      setVillageDetails(data);
    } catch (err) {
      console.error('Error fetching village details:', err);
      setError('Failed to load village details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleApprove = async (village: UnapprovedVillage) => {
    try {
      const apiUrl = `http://localhost:8000/api/response/approve/village_profile/${village.village_profile_id}`;

      const token = localStorage.getItem('auth_token');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to approve submission: ${response.status} ${errorText}`
        );
      }

      await fetchUnapprovedVillages();
    } catch (error) {
      console.error('Error approving submission:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to approve submission. Please try again.'
      );
    }
  };

  const handleReject = async (village: UnapprovedVillage) => {
    console.log('Reject village:', village.village_profile_id);
  };

  const handleCloseDetails = () => {
    setSelectedVillage(null);
    setVillageDetails([]);
    fetchUnapprovedVillages();
  };

  const groupByModule = (details: VillageDetail[]) => {
    const grouped: { [key: string]: VillageDetail[] } = {};
    details.forEach((detail) => {
      const key = `${detail.module_id}-${detail.module_name}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(detail);
    });
    return grouped;
  };

  if (selectedVillage) {
    return (
      <VillageDetailsView
        village={selectedVillage}
        details={villageDetails}
        isLoading={isLoadingDetails}
        onClose={handleCloseDetails}
        groupByModule={groupByModule}
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Approval Requests
        </h2>
        <p className="text-gray-600">
          Review and approve village profile submissions
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">
            Loading approval requests...
          </span>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : villages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No pending approval requests</p>
          <p className="text-gray-500 text-sm mt-2">
            All village submissions have been reviewed
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {villages.map((village) => (
            <VillageApprovalCard
              key={village.village_profile_id}
              village={village}
              onApprove={handleApprove}
              onReject={handleReject}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};
